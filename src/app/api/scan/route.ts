import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited, recordScan } from "@/lib/scan";

// POST /api/scan — enregistre un scan/vue (section 9.1), rate-limited
// (section 17.2). Utilisé par le client pour signaler une activation AR
// (arActivated: true) depuis la fiche plat.
const scanSchema = z.object({
  qrCodeId: z.string().min(1),
  dishId: z.string().min(1).optional(),
  arActivated: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await recordScan({
    ...parsed.data,
    deviceType: req.headers.get("user-agent") ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
