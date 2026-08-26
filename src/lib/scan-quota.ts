import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/billing";
import { ACTIVE_STATUSES } from "@/lib/scan-finalize";

// Chaque scan coûte 1 crédit KIRI, soit 1 $ US réel, débité immédiatement
// et non remboursé même si le modèle produit est inexploitable. Sans
// plafond, un restaurateur qui relance en boucle, ou un compte compromis,
// vide le solde du compte KIRI de Vorae : le plafond n'est donc pas une
// option commerciale mais un garde-fou financier.
//
// Le quota vit ici plutôt qu'en base : il découle du palier souscrit
// (lib/billing.ts, source unique des prix), et un chiffre par palier
// n'a pas besoin d'être modifiable restaurant par restaurant tant que
// personne ne l'a demandé.
const SCANS_PER_MONTH: Record<string, number> = {
  essentiel: 15,
  croissance: 45,
  // Le palier prestige inclut un nombre illimité de plats AR (section
  // 15.1), ce qui ne peut pas signifier un nombre illimité de scans
  // payants : ce plafond haut sert de garde-fou contre un emballement,
  // pas de limite commerciale. À relever si un client légitime l'atteint.
  prestige: 100,
};

// Restaurant sans abonnement actif (essai, pilote, compte créé à la main) :
// aligné sur les 10 crédits offerts à l'inscription KIRI, de quoi tester
// sans jamais engager de dépense.
const SCANS_WITHOUT_SUBSCRIPTION = 10;

export type ScanQuota = {
  limit: number;
  used: number;
  remaining: number;
  periodStart: Date;
};

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getScanQuota(restaurantId: string): Promise<ScanQuota> {
  const periodStart = startOfCurrentMonth();

  const [subscription, aggregate] = await Promise.all([
    prisma.subscription.findUnique({ where: { restaurantId } }),
    // Seuls les crédits réellement débités comptent : un job qui a échoué
    // avant l'appel fournisseur (clé invalide, média illisible) n'a rien
    // coûté et ne doit pas être décompté.
    prisma.scanJob.aggregate({
      where: { dish: { restaurantId }, createdAt: { gte: periodStart } },
      _sum: { creditsUsed: true },
    }),
  ]);

  const activeTier =
    subscription && ["trialing", "active"].includes(subscription.status)
      ? getTier(subscription.tier)
      : undefined;

  const limit = activeTier
    ? (SCANS_PER_MONTH[activeTier.id] ?? SCANS_WITHOUT_SUBSCRIPTION)
    : SCANS_WITHOUT_SUBSCRIPTION;
  const used = aggregate._sum.creditsUsed ?? 0;

  return { limit, used, remaining: Math.max(limit - used, 0), periodStart };
}

// Un double clic, ou un onglet rouvert, ne doit jamais déclencher deux
// scans facturés pour le même plat.
export async function hasActiveScanJob(dishId: string): Promise<boolean> {
  const active = await prisma.scanJob.findFirst({
    where: { dishId, status: { in: ACTIVE_STATUSES } },
    select: { id: true },
  });
  return active !== null;
}
