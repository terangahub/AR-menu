"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { GlobalDishRow } from "@/lib/analytics";

type SortKey = "name" | "scans30d" | "arRate" | "trend7dPct";

// Le tableau brut posait quatre colonnes de chiffres alignées : pour savoir
// quel plat marchait, le restaurateur devait lire chaque ligne et comparer
// mentalement. La question qu'il se pose est une question de grandeur
// relative, et une grandeur relative se lit à la longueur d'une barre, pas
// à un nombre. Chaque plat porte donc une barre proportionnelle au plat le
// plus vu, et le taux d'activation AR une jauge sur la même échelle.
//
// Toutes les barres ont la même couleur. Les foncer à mesure qu'elles
// s'allongent doublerait l'encodage de la longueur par la teinte, sur des
// catégories (des plats) qui n'ont aucun ordre naturel.
export function AnalyticsTable({ rows }: { rows: GlobalDishRow[] }) {
  const t = useTranslations("Dashboard.analytics");
  const [sortKey, setSortKey] = useState<SortKey>("scans30d");
  const [sortDesc, setSortDesc] = useState(true);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const dir = sortDesc ? -1 : 1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return (av - bv) * dir;
  });

  // L'échelle est celle du plat le plus vu, pas un maximum arbitraire : une
  // barre pleine veut dire "c'est le plat vedette", ce qui est exactement
  // la lecture attendue.
  const maxScans = Math.max(0, ...rows.map((r) => r.scans30d));

  // Tant qu'aucun plat n'a été vu, il n'y a rien à comparer : des barres
  // toutes vides n'apprennent rien et se lisent comme des filets de
  // séparation. Les nombres suffisent, et l'écran le dit.
  const showBars = maxScans > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("sortBy")}
        </span>
        <SortChip label={t("scans30d")} active={sortKey === "scans30d"} desc={sortDesc} onClick={() => toggleSort("scans30d")} />
        <SortChip label={t("arRate")} active={sortKey === "arRate"} desc={sortDesc} onClick={() => toggleSort("arRate")} />
        <SortChip label={t("trend7d")} active={sortKey === "trend7dPct"} desc={sortDesc} onClick={() => toggleSort("trend7dPct")} />
        <SortChip label={t("dish")} active={sortKey === "name"} desc={sortDesc} onClick={() => toggleSort("name")} />
      </div>

      <ul className="surface-panel divide-y divide-border/60">
        {sorted.map((row) => (
          <li key={row.id}>
            <Link
              href={`/dashboard/analytics/${row.id}`}
              className="flex flex-col gap-2.5 p-4 transition-colors hover:bg-foreground/[0.03]"
            >
              <span className="truncate font-medium">{row.name}</span>

              {/* La barre et son nombre sur la même ligne. Isolée sur sa
                  propre ligne et étalée sur toute la largeur, elle se
                  lisait comme un filet de séparation, d'autant que le plat
                  de tête, par définition à 100 %, produisait un trait
                  plein d'un bord à l'autre. Bornée par le nombre à sa
                  droite, elle se termine toujours avant le bord, donc elle
                  se lit comme une mesure.

                  Extrémité arrondie côté valeur, carrée côté origine : une
                  barre pousse depuis une ligne de départ, un filet n'a pas
                  d'origine. Et aucune largeur minimale : un plat jamais vu
                  mérite une barre vide, pas un moignon qui laisserait
                  croire à quelques vues. */}
              <div className="flex items-center gap-3">
                {showBars && (
                  <div className="h-2 flex-1 overflow-hidden rounded-r-[4px] bg-foreground/[0.06]">
                    {row.scans30d > 0 && (
                      <div
                        className="h-full rounded-r-[4px] bg-foreground/70"
                        style={{ width: `${(row.scans30d / maxScans) * 100}%` }}
                      />
                    )}
                  </div>
                )}
                <span
                  className={`font-heading text-lg leading-none tabular-nums ${
                    showBars ? "w-10 shrink-0 text-right" : "ml-auto"
                  }`}
                >
                  {row.scans30d}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <ArMeter label={t("arRate")} rate={row.arRate} noneLabel={t("noValue")} />
                <Trend label={t("trend7d")} pct={row.trend7dPct} noneLabel={t("noValue")} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Un taux est un rapport à une limite connue (100 %) : une jauge sur piste,
// pas une barre libre. La piste rappelle que 100 % existe, ce qu'un nombre
// nu ne dit pas.
function ArMeter({
  label,
  rate,
  noneLabel,
}: {
  label: string;
  rate: number | null;
  noneLabel: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      {rate == null ? (
        <span className="text-muted-foreground/70">{noneLabel}</span>
      ) : (
        <>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/[0.06]">
            {rate > 0 && (
              <span
                className="block h-full rounded-full bg-foreground/70"
                style={{ width: `${Math.min(100, rate)}%` }}
              />
            )}
          </span>
          <span className="font-medium tabular-nums text-foreground">{rate}%</span>
        </>
      )}
    </span>
  );
}

// La flèche et le signe portent le sens, la couleur ne fait que le
// confirmer : un restaurateur daltonien, ou qui consulte son téléphone au
// soleil, lit la même information.
function Trend({
  label,
  pct,
  noneLabel,
}: {
  label: string;
  pct: number | null;
  noneLabel: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      {pct == null ? (
        <span className="text-muted-foreground/70">{noneLabel}</span>
      ) : (
        <span
          className={`font-medium tabular-nums ${
            pct >= 0 ? "text-success" : "text-destructive"
          }`}
        >
          <span aria-hidden>{pct >= 0 ? "↑" : "↓"} </span>
          {pct >= 0 ? "+" : ""}
          {pct}%
        </span>
      )}
    </span>
  );
}

function SortChip({
  label,
  active,
  desc,
  onClick,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {label}
      {active && <span aria-hidden className="text-[10px]">{desc ? "↓" : "↑"}</span>}
    </button>
  );
}
