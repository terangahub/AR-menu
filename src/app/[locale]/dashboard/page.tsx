import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getOverviewStats } from "@/lib/analytics";
import { PageHeader, Panel, StatTile } from "@/components/dashboard/ui";

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
  const missing = stats.dishesMissingModel;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle", { restaurant: restaurantUser.restaurant.name })}
        actions={
          <Link
            href="/dashboard/analytics"
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("viewAnalytics")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t("scansToday")}
          value={stats.scans.today.count}
          deltaPct={stats.scans.today.deltaPct}
          vsLabel={t("vsPrevious")}
        />
        <StatTile
          label={t("scans7d")}
          value={stats.scans.last7d.count}
          deltaPct={stats.scans.last7d.deltaPct}
          vsLabel={t("vsPrevious")}
        />
        <StatTile
          label={t("scans30d")}
          value={stats.scans.last30d.count}
          deltaPct={stats.scans.last30d.deltaPct}
          vsLabel={t("vsPrevious")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel title={t("topDishOfWeek")}>
          {stats.topDishOfTheWeek ? (
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-xl leading-tight">
                {stats.topDishOfTheWeek.name}
              </p>
              <span className="text-sm tabular-nums text-muted-foreground">
                {t("scansCount", { count: stats.topDishOfTheWeek.scans })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noTopDish")}</p>
          )}
        </Panel>

        <Panel title={t("arActivationRate")}>
          {stats.arActivationRate30d != null ? (
            <p className="font-heading text-3xl leading-none tabular-nums">
              {stats.arActivationRate30d}%
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noArData")}</p>
          )}
        </Panel>
      </div>

      {/* Les plats sans modèle 3D sont la seule alerte de cet écran, et
          c'est du travail à faire, pas une statistique : elle se présente
          comme une liste d'actions, chaque plat menant directement à son
          écran de capture. Quand il n'y en a plus, le panneau confirme
          plutôt que de disparaître, pour que l'absence d'alerte se
          distingue d'un écran qui n'a pas chargé. */}
      <Panel
        title={t("missingModelTitle")}
        description={missing.length > 0 ? t("missingModelHint") : undefined}
      >
        {missing.length === 0 ? (
          <p className="text-sm text-success">{t("missingModelEmpty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {missing.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/dashboard/dishes/${d.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
                >
                  <span className="truncate">{d.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t("missingModelAction")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
