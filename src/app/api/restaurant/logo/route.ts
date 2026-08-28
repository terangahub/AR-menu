import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 Mo
// SVG volontairement exclu : un SVG est un document exécutable, servi
// depuis notre domaine il ouvrirait une porte à du script injecté.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST/DELETE /api/restaurant/logo - logo affiché en tête du menu public
// et sur les QR codes imprimés (section 10.5).
export async function POST(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buffer, {
    folder: `vorae/${restaurantUser.restaurantId}`,
    resourceType: "image",
    // publicId fixe : chaque nouveau logo remplace le précédent au lieu
    // d'accumuler des fichiers orphelins sur Cloudinary.
    publicId: "logo",
  });

  const updated = await prisma.restaurant.update({
    where: { id: restaurantUser.restaurantId },
    data: { logoUrl: result.secure_url },
  });

  return NextResponse.json({ logoUrl: updated.logoUrl });
}

export async function DELETE() {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.restaurant.update({
    where: { id: restaurantUser.restaurantId },
    data: { logoUrl: null },
  });

  return NextResponse.json({ logoUrl: null });
}
