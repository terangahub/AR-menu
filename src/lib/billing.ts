import Stripe from "stripe";

// Modèle de tarification (cahier des charges section 15.1) — 3 paliers,
// mensuel/annuel. Les stripePriceId sont résolus depuis les variables
// d'environnement (voir .env.example) : chaque palier/cycle correspond à
// un Price Stripe créé manuellement dans le Dashboard Stripe (pas
// d'accès programmatique au compte Stripe du client depuis cet
// environnement — voir CONTEXT.md).
export const TIERS = [
  {
    id: "essentiel",
    includedDishSlots: 10,
    monthlyPriceCad: 79,
    annualPriceCad: 790,
    extraDishPriceCad: 8,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ESSENTIEL_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ESSENTIEL_ANNUAL,
  },
  {
    id: "croissance",
    includedDishSlots: 30,
    monthlyPriceCad: 199,
    annualPriceCad: 1990,
    extraDishPriceCad: 6,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CROISSANCE_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CROISSANCE_ANNUAL,
  },
  {
    id: "prestige",
    // -1 = illimité (pas de quota de plats AR pour ce palier, section 15.1).
    includedDishSlots: -1,
    monthlyPriceCad: 449,
    annualPriceCad: 4490,
    extraDishPriceCad: null,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRESTIGE_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRESTIGE_ANNUAL,
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type BillingCycle = "monthly" | "annual";

export function getTier(id: string) {
  return TIERS.find((t) => t.id === id);
}

export function priceIdFor(tierId: TierId, cycle: BillingCycle): string | undefined {
  const tier = getTier(tierId);
  if (!tier) return undefined;
  return cycle === "annual" ? tier.stripePriceIdAnnual : tier.stripePriceIdMonthly;
}

// Construit les champs Subscription (schema.prisma) à partir d'un objet
// Stripe.Subscription — utilisé par le webhook (checkout.session.completed,
// customer.subscription.updated) pour garder la copie locale synchronisée.
export function subscriptionFieldsFrom(sub: Stripe.Subscription) {
  const tierId = (sub.metadata?.tier as TierId | undefined) ?? "essentiel";
  const tier = getTier(tierId);
  const interval = sub.items.data[0]?.price?.recurring?.interval;
  const currentPeriodEndSeconds = sub.items.data[0]?.current_period_end;

  return {
    tier: tierId,
    billingCycle: interval === "year" ? "annual" : "monthly",
    status: sub.status,
    includedDishSlots: tier?.includedDishSlots ?? 0,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: currentPeriodEndSeconds
      ? new Date(currentPeriodEndSeconds * 1000)
      : null,
  };
}

let stripeClient: Stripe | null = null;

// Instancié à l'appel (pas au chargement du module) : la clé secrète n'est
// nécessaire qu'au moment d'un appel réel à l'API Stripe, pas pour que le
// reste de l'app (build, autres routes) fonctionne sans elle en dev.
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante — voir .env.example");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
