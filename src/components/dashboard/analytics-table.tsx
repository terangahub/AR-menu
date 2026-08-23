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
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
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
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="p-3">
                <Link
                  href={`/dashboard/analytics/${row.id}`}
                  className="hover:underline"
                >
                  {row.name}
                </Link>
              </td>
              <td className="p-3">{row.scans30d}</td>
              <td className="p-3">{row.arRate != null ? `${row.arRate}%` : "—"}</td>
              <td className="p-3">
                {row.trend7dPct != null ? (
                  <span className={row.trend7dPct >= 0 ? "text-success" : "text-destructive"}>
                    {row.trend7dPct >= 0 ? "↑" : "↓"} {Math.abs(row.trend7dPct)}%
                  </span>
                ) : (
                  "—"
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
    <th className="p-3 font-medium">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-foreground">
        {label}
        {active && <span className="text-xs">{desc ? "↓" : "↑"}</span>}
      </button>
    </th>
  );
}
