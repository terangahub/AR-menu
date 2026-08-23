import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST /api/dishes/[id]/photo — upload photo (section 10.2).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish || dish.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
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
    folder: `vorae/${restaurantUser.restaurantId}/dishes`,
    resourceType: "image",
    publicId: id,
  });

  const updated = await prisma.dish.update({
    where: { id },
    data: { imageUrl: result.secure_url },
  });

  return NextResponse.json({ imageUrl: updated.imageUrl });
}
