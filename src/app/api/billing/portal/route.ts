import { NextRequest, NextResponse } from "next/server";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getStripe } from "@/lib/billing";

// POST /api/billing/portal — ouvre le portail client Stripe (factures PDF,
// changement de palier en libre-service avec proratisation automatique,
// annulation — section 10.6). Le portail Stripe gère lui-même la logique
// de changement de palier/proratisation ; aucune configuration produit
// requise côté code, seulement dans le Dashboard Stripe (Customer Portal
// Settings → Products autorisés).
export async function POST(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = restaurantUser.restaurant;
  if (!restaurant.stripeCustomerId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif — commencez par un checkout" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const locale = body?.locale === "en" ? "en" : "fr";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: restaurant.stripeCustomerId,
    return_url: `${appUrl}/${locale}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
