import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getStripe, getTier, priceIdFor, type TierId, type BillingCycle } from "@/lib/billing";

const checkoutSchema = z.object({
  tier: z.enum(["essentiel", "croissance", "prestige"]),
  cycle: z.enum(["monthly", "annual"]),
  locale: z.enum(["fr", "en"]),
});

// POST /api/billing/checkout — crée une session Stripe Checkout pour le
// palier/cycle demandé (section 9.2, 10.6). Réutilise le stripeCustomerId
// existant du restaurant s'il y en a un, sinon laisse Stripe en créer un
// (lié après coup via le webhook checkout.session.completed).
export async function POST(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tier, cycle, locale } = parsed.data as {
    tier: TierId;
    cycle: BillingCycle;
    locale: "fr" | "en";
  };

  const tierDef = getTier(tier);
  const priceId = priceIdFor(tier, cycle);
  if (!tierDef || !priceId) {
    return NextResponse.json(
      { error: "Palier/cycle non configuré côté serveur (variable STRIPE_PRICE_* manquante)" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const restaurant = restaurantUser.restaurant;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: restaurant.stripeCustomerId ?? undefined,
    customer_email: restaurant.stripeCustomerId ? undefined : restaurant.email,
    client_reference_id: restaurant.id,
    subscription_data: {
      metadata: { restaurantId: restaurant.id, tier, cycle },
    },
    metadata: { restaurantId: restaurant.id, tier, cycle },
    success_url: `${appUrl}/${locale}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/${locale}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
