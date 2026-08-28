"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";

// Le tracé était en `--primary`, le lavande pâle banni partout ailleurs, et
// l'infobulle était celle par défaut de Recharts : une boîte blanche à
// texte noir, illisible en mode sombre. Tout passe ici par les tokens
// sémantiques, donc les deux thèmes sont couverts par construction.
//
// Une seule série : pas de légende, le titre du panneau la nomme déjà. Un
// aplat sous la courbe donne du corps à une série unique sans introduire
// de seconde couleur.
const INK = "hsl(var(--foreground))";

export function DishTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const t = useTranslations("Dashboard.analytics");

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity={0.16} />
            <stop offset="100%" stopColor={INK} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grille horizontale seule, en trait plein et discret : des
            verticales n'aideraient pas à lire une hauteur, et un pointillé
            attire l'oeil sur le décor plutôt que sur la courbe. */}
        <CartesianGrid
          vertical={false}
          stroke="hsl(var(--border))"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          allowDecimals={false}
          width={36}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.25, strokeWidth: 1 }}
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "0 12px 32px -18px hsl(250 45% 11% / 0.35)",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 2 }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value) => [String(value), t("scansLabel")]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="url(#trendFill)"
          dot={false}
          activeDot={{ r: 4, fill: INK, stroke: "hsl(var(--background))", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
