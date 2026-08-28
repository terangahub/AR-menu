import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getDishAnalytics } from "@/lib/analytics";
import { localizedDishName } from "@/lib/dish-locale";
import { Link } from "@/i18n/navigation";
import { DishTrendChart } from "@/components/dashboard/dish-trend-chart";
import { PageHeader, Panel, StatTile } from "@/components/dashboard/ui";

// Analytics par plat, individuellement (section 10.3) : scans par période,
// taux d'activation AR, tendance, heure la plus consultée.
export default async function DishAnalyticsPage({
  params,
}: {
  params: Promise<{ dishId: string; locale: string }>;
}) {
  const { dishId, locale } = await params;
  const t = await getTranslations("Dashboard.analytics");
  const restaurantUser = await getCurrentRestaurantUser();

  const dish = restaurantUser
    ? await prisma.dish.findUnique({
        where: { id: dishId },
        select: { id: true, name: true, nameEn: true, restaurantId: true },
      })
    : null;

  if (!dish || !restaurantUser || dish.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const analytics = await getDishAnalytics(restaurantUser.restaurantId, dish.id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/analytics"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden>&larr;</span>
        {t("backToOverview")}
      </Link>

      <PageHeader title={localizedDishName(dish.name, dish.nameEn, locale)} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label={t("today")} value={analytics.counts.today} />
        <StatTile label={t("last7d")} value={analytics.counts.last7d} />
        <StatTile label={t("last30d")} value={analytics.counts.last30d} />
        <StatTile label={t("last90d")} value={analytics.counts.last90d} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel title={t("arRate")}>
          <p className="font-heading text-3xl leading-none tabular-nums">
            {analytics.arActivationRate != null ? `${analytics.arActivationRate}%` : "-"}
          </p>
        </Panel>
        <Panel title={t("busiestHour")}>
          {analytics.busiestHour != null ? (
            <p className="font-heading text-3xl leading-none tabular-nums">
              {t("busiestHourValue", { hour: analytics.busiestHour })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noBusiestHour")}</p>
          )}
        </Panel>
      </div>

      <Panel title={t("trendChart")}>
        {analytics.trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        ) : (
          <DishTrendChart data={analytics.trend} />
        )}
      </Panel>
    </div>
  );
}
