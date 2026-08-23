import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getGlobalDishTable } from "@/lib/analytics";
import { AnalyticsTable } from "@/components/dashboard/analytics-table";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <a
          href={`/api/analytics/export?locale=${locale}`}
          className="text-sm text-primary hover:underline"
        >
          {t("exportCsv")}
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("noData")}</p>
      ) : (
        <AnalyticsTable rows={rows} />
      )}
    </div>
  );
}
