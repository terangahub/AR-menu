import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getGlobalDishTable } from "@/lib/analytics";
import { AnalyticsTable } from "@/components/dashboard/analytics-table";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";

// Vue globale analytics (section 10.3) : tableau triable + export CSV.
export default async function DashboardAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.analytics");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const rows = await getGlobalDishTable(restaurantUser.restaurantId, locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          rows.length > 0 ? (
            <a
              href={`/api/analytics/export?locale=${locale}`}
              className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {t("exportCsv")}
            </a>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title={t("noData")}
          description={t("noDataHint")}
          actionLabel={t("goToQrCodes")}
          actionHref="/dashboard/qrcodes"
        />
      ) : (
        <AnalyticsTable rows={rows} />
      )}
    </div>
  );
}
