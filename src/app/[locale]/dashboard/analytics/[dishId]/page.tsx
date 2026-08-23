import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getDishAnalytics } from "@/lib/analytics";
import { Link } from "@/i18n/navigation";
import { DishTrendChart } from "@/components/dashboard/dish-trend-chart";

// Analytics par plat, individuellement (section 10.3) : scans par période,
// taux d'activation AR, tendance, heure la plus consultée.
export default async function DishAnalyticsPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { dishId } = await params;
  const t = await getTranslations("Dashboard.analytics");
  const restaurantUser = await getCurrentRestaurantUser();

  const dish = restaurantUser
    ? await prisma.dish.findUnique({ where: { id: dishId }, select: { id: true, name: true, restaurantId: true } })
    : null;

  if (!dish || !restaurantUser || dish.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const analytics = await getDishAnalytics(restaurantUser.restaurantId, dish.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/analytics" className="text-sm text-muted-foreground hover:underline">
        ← {t("backToOverview")}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">{dish.name}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("today")} value={analytics.counts.today} />
        <Stat label={t("last7d")} value={analytics.counts.last7d} />
        <Stat label={t("last30d")} value={analytics.counts.last30d} />
        <Stat label={t("last90d")} value={analytics.counts.last90d} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t("arRate")}</h2>
          <p className="mt-2 text-2xl font-semibold">
            {analytics.arActivationRate != null ? `${analytics.arActivationRate}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t("busiestHour")}</h2>
          <p className="mt-2 text-2xl font-semibold">
            {analytics.busiestHour != null
              ? t("busiestHourValue", { hour: analytics.busiestHour })
              : t("noBusiestHour")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t("trendChart")}</h2>
        {analytics.trend.length === 0 ? (
          <p className="text-muted-foreground">{t("noData")}</p>
        ) : (
          <DishTrendChart data={analytics.trend} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
