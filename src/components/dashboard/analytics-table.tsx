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
  // la lecture attendue. Le garde-fou à 1 évite une division par zéro le
  // jour de l'installation, quand aucun plat n'a encore été scanné.
  const maxScans = Math.max(1, ...rows.map((r) => r.scans30d));

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
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium">{row.name}</span>
                <span className="shrink-0 font-heading text-lg leading-none tabular-nums">
                  {row.scans30d}
                </span>
              </div>

              {/* Extrémité arrondie côté valeur, carrée côté ligne de
                  départ : la barre garde une origine nette, ce qui permet
                  de comparer les longueurs à l'oeil. */}
              <div className="h-1.5 w-full overflow-hidden rounded-r-[4px] bg-foreground/[0.07]">
                <div
                  className="h-full rounded-r-[4px] bg-foreground/45"
                  style={{ width: `${Math.max(2, (row.scans30d / maxScans) * 100)}%` }}
                />
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
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/[0.07]">
            <span
              className="block h-full rounded-full bg-foreground/45"
              style={{ width: `${Math.min(100, Math.max(2, rate))}%` }}
            />
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
