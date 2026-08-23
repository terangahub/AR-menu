import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getOverviewStats } from "@/lib/analytics";

// Vue d'ensemble (section 10.1) : scans avec variation, plat le plus vu de
// la semaine, taux d'activation AR, alerte modèles 3D manquants.
export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.overview");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    redirect({ href: "/dashboard/dishes", locale });
    return;
  }

  const stats = await getOverviewStats(restaurantUser.restaurantId, locale);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("scansToday")} value={stats.scans.today.count} deltaPct={stats.scans.today.deltaPct} vsLabel={t("vsPrevious")} />
        <StatCard label={t("scans7d")} value={stats.scans.last7d.count} deltaPct={stats.scans.last7d.deltaPct} vsLabel={t("vsPrevious")} />
        <StatCard label={t("scans30d")} value={stats.scans.last30d.count} deltaPct={stats.scans.last30d.deltaPct} vsLabel={t("vsPrevious")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t("topDishOfWeek")}</h2>
          {stats.topDishOfTheWeek ? (
            <p className="mt-2 text-lg font-semibold">
              {stats.topDishOfTheWeek.name}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({stats.topDishOfTheWeek.scans})
              </span>
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">{t("noTopDish")}</p>
          )}
        </div>

        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t("arActivationRate")}</h2>
          <p className="mt-2 text-lg font-semibold">
            {stats.arActivationRate30d != null ? `${stats.arActivationRate30d}%` : t("noArData")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">{t("missingModelTitle")}</h2>
        {stats.dishesMissingModel.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{t("missingModelEmpty")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {stats.dishesMissingModel.map((d) => (
              <li key={d.id} className="text-sm">
                <Link
                  href={`/dashboard/dishes/${d.id}/edit`}
                  className="text-destructive hover:underline"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/dashboard/analytics" className="text-sm text-primary hover:underline">
        {t("viewAnalytics")} →
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  deltaPct,
  vsLabel,
}: {
  label: string;
  value: number;
  deltaPct: number | null;
  vsLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {deltaPct != null && (
        <p
          className={`mt-1 text-xs ${
            deltaPct >= 0 ? "text-success" : "text-destructive"
          }`}
        >
          {deltaPct >= 0 ? "+" : ""}
          {deltaPct}% {vsLabel}
        </p>
      )}
    </div>
  );
}
