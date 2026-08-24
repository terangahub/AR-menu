import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl, generateQrPngBuffer } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

// GET /api/qrcodes/[id]/png - régénère le PNG à la volée (pas stocké en
// base, coût de génération négligeable) pour le téléchargement (section
// 10.4). Renvoie l'image brute avec Content-Disposition: attachment :
// le déclenchement de téléchargement côté client (<a download>) n'est pas
// fiable sur Safari iOS, en particulier avec des data URIs ; l'en-tête
// HTTP, lui, est respecté.
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

  const png = await generateQrPngBuffer(absoluteMenuUrl(qrCode.targetUrl));
  const filename = `vorae-qr-table-${qrCode.tableNumber ?? qrCode.id}.png`;

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
