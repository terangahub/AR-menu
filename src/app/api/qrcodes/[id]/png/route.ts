import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl, generateQrPngDataUrl } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

// GET /api/qrcodes/[id]/png — régénère le PNG à la volée (pas stocké en
// base, coût de génération négligeable) pour le téléchargement/impression
// (section 10.4).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qrCode = await prisma.qrCode.findUnique({ where: { id } });
  if (!qrCode || qrCode.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const png = await generateQrPngDataUrl(absoluteMenuUrl(qrCode.targetUrl));
  return NextResponse.json({ png, tableNumber: qrCode.tableNumber });
}
