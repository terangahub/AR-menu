import { prisma } from "@/lib/prisma";

// Analytics par plat (section 10.1, 10.3). Toute mesure basée sur
// ScanEvent : une ligne dishId=null = un scan de menu (F01), une ligne
// dishId=X, arActivated=false = une vue de fiche plat, dishId=X,
// arActivated=true = une activation AR (voir section 24 du CONTEXT.md /
// dish-ar-section.tsx + [dishId]/page.tsx).

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

async function countScans(
  restaurantId: string,
  opts: { since?: Date; until?: Date; dishId?: string; arActivatedOnly?: boolean }
) {
  return prisma.scanEvent.count({
    where: {
      qrCode: { restaurantId },
      dishId: opts.dishId ?? undefined,
      arActivated: opts.arActivatedOnly ? true : undefined,
      timestamp: {
        gte: opts.since,
        lt: opts.until,
      },
    },
  });
}

// --- Vue d'ensemble (section 10.1) ---

export async function getOverviewStats(restaurantId: string) {
  const [scansToday, scansYesterday, scans7d, scansPrevious7d, scans30d, scansPrevious30d] =
    await Promise.all([
      countScans(restaurantId, { since: daysAgo(1) }),
      countScans(restaurantId, { since: daysAgo(2), until: daysAgo(1) }),
      countScans(restaurantId, { since: daysAgo(7) }),
      countScans(restaurantId, { since: daysAgo(14), until: daysAgo(7) }),
      countScans(restaurantId, { since: daysAgo(30) }),
      countScans(restaurantId, { since: daysAgo(60), until: daysAgo(30) }),
    ]);

  const [dishViews30d, arActivations30d] = await Promise.all([
    prisma.scanEvent.count({
      where: { qrCode: { restaurantId }, dishId: { not: null }, timestamp: { gte: daysAgo(30) } },
    }),
    prisma.scanEvent.count({
      where: {
        qrCode: { restaurantId },
        dishId: { not: null },
        arActivated: true,
        timestamp: { gte: daysAgo(30) },
      },
    }),
  ]);

  const topDishRow = await prisma.scanEvent.groupBy({
    by: ["dishId"],
    where: { qrCode: { restaurantId }, dishId: { not: null }, timestamp: { gte: daysAgo(7) } },
    _count: { dishId: true },
    orderBy: { _count: { dishId: "desc" } },
    take: 1,
  });
  const topDish = topDishRow[0]?.dishId
    ? await prisma.dish.findUnique({
        where: { id: topDishRow[0].dishId },
        select: { id: true, name: true },
      })
    : null;

  const dishesMissingModel = await prisma.dish.findMany({
    where: { restaurantId, isAvailable: true, isArReady: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    scans: {
      today: { count: scansToday, deltaPct: percentDelta(scansToday, scansYesterday) },
      last7d: { count: scans7d, deltaPct: percentDelta(scans7d, scansPrevious7d) },
      last30d: { count: scans30d, deltaPct: percentDelta(scans30d, scansPrevious30d) },
    },
    topDishOfTheWeek: topDish
      ? { id: topDish.id, name: topDish.name, scans: topDishRow[0]._count.dishId }
      : null,
    arActivationRate30d: dishViews30d > 0 ? Math.round((arActivations30d / dishViews30d) * 100) : null,
    dishesMissingModel,
  };
}

// --- Analytics par plat (section 10.3) ---

export async function getDishAnalytics(restaurantId: string, dishId: string) {
  const [today, last7d, last30d, last90d, viewsAllTime, arAllTime] = await Promise.all([
    countScans(restaurantId, { since: daysAgo(1), dishId }),
    countScans(restaurantId, { since: daysAgo(7), dishId }),
    countScans(restaurantId, { since: daysAgo(30), dishId }),
    countScans(restaurantId, { since: daysAgo(90), dishId }),
    countScans(restaurantId, { dishId }),
    countScans(restaurantId, { dishId, arActivatedOnly: true }),
  ]);

  const trend = await getDailyTrend(restaurantId, dishId, 30);
  const hourly = await getHourlyDistribution(restaurantId, dishId);
  const busiestHour = hourly.reduce(
    (best, h) => (h.count > best.count ? h : best),
    { hour: 0, count: 0 }
  );

  return {
    counts: { today, last7d, last30d, last90d },
    arActivationRate: viewsAllTime > 0 ? Math.round((arAllTime / viewsAllTime) * 100) : null,
    trend,
    hourly,
    busiestHour: busiestHour.count > 0 ? busiestHour.hour : null,
  };
}

async function getDailyTrend(restaurantId: string, dishId: string, days: number) {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "timestamp") AS day, COUNT(*) AS count
    FROM "ScanEvent" se
    JOIN "QrCode" qc ON qc.id = se."qrCodeId"
    WHERE qc."restaurantId" = ${restaurantId}
      AND se."dishId" = ${dishId}
      AND se."timestamp" >= ${daysAgo(days)}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), count: Number(r.count) }));
}

async function getHourlyDistribution(restaurantId: string, dishId: string) {
  const rows = await prisma.$queryRaw<{ hour: number; count: bigint }[]>`
    SELECT EXTRACT(HOUR FROM "timestamp")::int AS hour, COUNT(*) AS count
    FROM "ScanEvent" se
    JOIN "QrCode" qc ON qc.id = se."qrCodeId"
    WHERE qc."restaurantId" = ${restaurantId}
      AND se."dishId" = ${dishId}
    GROUP BY hour
    ORDER BY hour ASC
  `;
  const byHour = new Map(rows.map((r) => [r.hour, Number(r.count)]));
  return Array.from({ length: 24 }, (_, hour) => ({ hour, count: byHour.get(hour) ?? 0 }));
}

// --- Vue globale (section 10.3) ---

export type GlobalDishRow = {
  id: string;
  name: string;
  scans30d: number;
  arRate: number | null;
  trend7dPct: number | null;
};

export async function getGlobalDishTable(restaurantId: string): Promise<GlobalDishRow[]> {
  const dishes = await prisma.dish.findMany({
    where: { restaurantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    dishes.map(async (dish) => {
      const [scans30d, views, arViews, last7d, previous7d] = await Promise.all([
        countScans(restaurantId, { since: daysAgo(30), dishId: dish.id }),
        countScans(restaurantId, { dishId: dish.id }),
        countScans(restaurantId, { dishId: dish.id, arActivatedOnly: true }),
        countScans(restaurantId, { since: daysAgo(7), dishId: dish.id }),
        countScans(restaurantId, { since: daysAgo(14), until: daysAgo(7), dishId: dish.id }),
      ]);

      return {
        id: dish.id,
        name: dish.name,
        scans30d,
        arRate: views > 0 ? Math.round((arViews / views) * 100) : null,
        trend7dPct: percentDelta(last7d, previous7d),
      };
    })
  );
}
