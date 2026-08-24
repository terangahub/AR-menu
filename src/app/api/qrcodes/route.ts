import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl, generateQrPngDataUrl } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

// GET/POST /api/qrcodes - génération par table (section 10.4, 9.2).
export async function GET() {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qrCodes = await prisma.qrCode.findMany({
    where: { restaurantId: restaurantUser.restaurantId },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json(qrCodes);
}

const createSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20),
});

export async function POST(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const qrCode = await prisma.qrCode.create({
    data: {
      restaurantId: restaurantUser.restaurantId,
      tableNumber: parsed.data.tableNumber,
      // targetUrl est finalisée après création (elle a besoin de l'id du
      // QR code lui-même) - placeholder mis à jour juste après.
      targetUrl: "",
    },
  });

  const targetUrl = `/fr/${restaurantUser.restaurant.slug}?qr=${qrCode.id}`;
  const updated = await prisma.qrCode.update({
    where: { id: qrCode.id },
    data: { targetUrl },
  });

  const png = await generateQrPngDataUrl(absoluteMenuUrl(targetUrl));

  return NextResponse.json({ ...updated, png }, { status: 201 });
}
