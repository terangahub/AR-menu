import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/billing";
import { ACTIVE_STATUSES } from "@/lib/scan-finalize";

// Scanner un plat coûte 2 crédits KIRI, soit 2 $ US réels, débités
// immédiatement et non remboursés même si le modèle produit est
// inexploitable. Deux et non un : un appel ne renvoie qu'un seul format
// (constaté au premier scan réel, S7-16), or le GLB seul ne suffit pas
// pour la réalité augmentée sur iPhone, qui exige un USDZ. Il faut donc
// un appel par format. Sans plafond, un restaurateur qui relance en
// boucle, ou un compte compromis, vide le solde du compte KIRI de Vorae :
// le plafond n'est pas une option commerciale mais un garde-fou financier.
export const CREDITS_PER_SCAN = 2;
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

// Exprimé en plats scannés côté restaurateur (ce qu'il comprend), en
// crédits côté fournisseur (ce qui est facturé). Les deux sont exposés
// pour qu'aucune conversion implicite ne traîne dans l'interface.
export type ScanQuota = {
  limit: number;
  used: number;
  remaining: number;
  remainingCredits: number;
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

  // Le plafond est pensé en plats, la consommation est mesurée en
  // crédits : c'est la conversion entre les deux qui doit être explicite,
  // pas devinée par l'appelant.
  const limitCredits = limit * CREDITS_PER_SCAN;
  const usedCredits = aggregate._sum.creditsUsed ?? 0;
  const remainingCredits = Math.max(limitCredits - usedCredits, 0);

  return {
    limit,
    // Arrondi au plat entier : un crédit isolé ne permet pas de scanner
    // un plat complet, annoncer « 1 scan restant » serait faux.
    used: Math.floor(usedCredits / CREDITS_PER_SCAN),
    remaining: Math.floor(remainingCredits / CREDITS_PER_SCAN),
    remainingCredits,
    periodStart,
  };
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
