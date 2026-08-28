"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { GlobalDishRow } from "@/lib/analytics";

type SortKey = "name" | "scans30d" | "arRate" | "trend7dPct";

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

  return (
    // `overflow-x-auto` sur le conteneur et non sur la page : sur un
    // téléphone, quatre colonnes de chiffres ne tiennent pas, et c'est le
    // tableau qui doit défiler latéralement, pas l'écran entier.
    <div className="surface-panel overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <Th label={t("dish")} active={sortKey === "name"} desc={sortDesc} onClick={() => toggleSort("name")} />
            <Th
              label={t("scans30d")}
              active={sortKey === "scans30d"}
              desc={sortDesc}
              onClick={() => toggleSort("scans30d")}
            />
            <Th label={t("arRate")} active={sortKey === "arRate"} desc={sortDesc} onClick={() => toggleSort("arRate")} />
            <Th
              label={t("trend7d")}
              active={sortKey === "trend7dPct"}
              desc={sortDesc}
              onClick={() => toggleSort("trend7dPct")}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.03]"
            >
              <td className="p-3">
                <Link
                  href={`/dashboard/analytics/${row.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {row.name}
                </Link>
              </td>
              <td className="p-3 tabular-nums">{row.scans30d}</td>
              <td className="p-3 tabular-nums">
                {row.arRate != null ? `${row.arRate}%` : "-"}
              </td>
              <td className="p-3 tabular-nums">
                {row.trend7dPct != null ? (
                  <span className={row.trend7dPct >= 0 ? "text-success" : "text-destructive"}>
                    {row.trend7dPct >= 0 ? "↑" : "↓"} {Math.abs(row.trend7dPct)}%
                  </span>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
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
    <th className="p-3 font-medium" aria-sort={active ? (desc ? "descending" : "ascending") : "none"}>
      <button
        onClick={onClick}
        className={`flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <span aria-hidden className={`text-[10px] ${active ? "" : "opacity-0"}`}>
          {desc ? "↓" : "↑"}
        </span>
      </button>
    </th>
  );
}
