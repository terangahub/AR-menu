import { prisma } from "@/lib/prisma";

// Rate limiting en mémoire - suffisant pour un seul serveur en Sprint 1
// (section 17.2). À remplacer par un store partagé (ex. Upstash Redis)
// avant un déploiement multi-instance.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > MAX_REQUESTS_PER_WINDOW;
}

export async function recordScan(input: {
  qrCodeId: string;
  dishId?: string;
  arActivated?: boolean;
  deviceType?: string;
}) {
  const qrCode = await prisma.qrCode.findUnique({
    where: { id: input.qrCodeId },
  });
  if (!qrCode) {
    return { ok: false as const, error: "QR code not found" };
  }

  await prisma.$transaction([
    prisma.scanEvent.create({
      data: {
        qrCodeId: input.qrCodeId,
        dishId: input.dishId,
        arActivated: input.arActivated ?? false,
        deviceType: input.deviceType,
      },
    }),
    prisma.qrCode.update({
      where: { id: input.qrCodeId },
      data: { scansCount: { increment: 1 } },
    }),
  ]);

  return { ok: true as const };
}
