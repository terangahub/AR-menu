import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, subscriptionFieldsFrom } from "@/lib/billing";

export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe - synchronise Subscription/Invoice (section 8,
// 9.3) avec les événements Stripe. Signature vérifiée avec le corps brut de
// la requête (obligatoire pour Stripe - jamais passer par req.json() ici).
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const restaurantId = session.client_reference_id ?? session.metadata?.restaurantId;
      if (!restaurantId || !session.subscription || !session.customer) break;

      const subscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === "string" ? session.subscription : session.subscription.id
      );

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer.id,
        },
      });

      const fields = subscriptionFieldsFrom(subscription);
      await prisma.subscription.upsert({
        where: { restaurantId },
        create: { restaurantId, ...fields },
        update: fields,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const restaurantId = subscription.metadata?.restaurantId;
      if (!restaurantId) break;

      const fields = subscriptionFieldsFrom(subscription);
      await prisma.subscription.upsert({
        where: { restaurantId },
        create: { restaurantId, ...fields },
        update: fields,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const restaurantId = subscription.metadata?.restaurantId;
      if (!restaurantId) break;

      await prisma.subscription
        .update({ where: { restaurantId }, data: { status: "canceled" } })
        .catch(() => null);
      break;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const restaurant = await prisma.restaurant.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (!restaurant) break;

      await prisma.invoice.create({
        data: {
          restaurantId: restaurant.id,
          stripeInvoiceId: invoice.id ?? "",
          amount: (invoice.amount_paid || invoice.amount_due) / 100,
          status: event.type === "invoice.paid" ? "paid" : "failed",
          pdfUrl: invoice.invoice_pdf,
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
