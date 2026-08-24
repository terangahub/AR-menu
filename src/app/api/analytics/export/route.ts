import { NextRequest, NextResponse } from "next/server";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { getGlobalDishTable } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// GET /api/analytics/export - export CSV du tableau global (section 10.3).
// Content-Disposition côté serveur plutôt qu'un <a download> côté client
// - voir la note sur Safari iOS dans CONTEXT.md (même piège que le PNG
// des QR codes). Route hors du segment [locale] : la locale du dashboard
// est passée en query string par le lien d'export (voir analytics/page.tsx).
export async function GET(request: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
  const rows = await getGlobalDishTable(restaurantUser.restaurantId, locale);

  const header =
    locale === "en"
      ? "Dish,Scans (30d),AR rate (%),7d trend (%)"
      : "Plat,Scans (30j),Taux AR (%),Tendance 7j (%)";
  const lines = rows.map((r) =>
    [
      `"${r.name.replace(/"/g, '""')}"`,
      r.scans30d,
      r.arRate ?? "",
      r.trend7dPct ?? "",
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vorae-analytics.csv"',
    },
  });
}
