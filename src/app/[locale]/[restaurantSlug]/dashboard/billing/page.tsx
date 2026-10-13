import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { PageHeader } from "@/components/dashboard/ui";

// Facturation (section 10.6) : palier actuel, cycle, renouvellement,
// historique de factures, changement de palier / portail Stripe.
export default async function DashboardBillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.billing");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { restaurantId: restaurantUser.restaurantId } }),
    prisma.invoice.findMany({
      where: { restaurantId: restaurantUser.restaurantId },
      orderBy: { issuedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <BillingPanel
        locale={locale as "fr" | "en"}
        subscription={
          subscription
            ? {
                tier: subscription.tier,
                billingCycle: subscription.billingCycle,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
              }
            : null
        }
        invoices={invoices.map((inv) => ({
          id: inv.id,
          amount: Number(inv.amount),
          status: inv.status,
          pdfUrl: inv.pdfUrl,
          issuedAt: inv.issuedAt.toISOString(),
        }))}
      />
    </div>
  );
}
