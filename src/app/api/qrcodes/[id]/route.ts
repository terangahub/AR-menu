import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/qrcodes/[id] - retrait d'un QR code (section 10.4).
export async function DELETE(
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

  // Les scans historiques référencent ce QR code - on les retire avec, pour
  // ne pas laisser de lignes orphelines (pas de ON DELETE CASCADE défini).
  await prisma.scanEvent.deleteMany({ where: { qrCodeId: id } });
  await prisma.qrCode.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
