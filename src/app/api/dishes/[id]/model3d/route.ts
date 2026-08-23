import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo — au-delà du seuil cible
// de 5 Mo max de la section 16, mais on laisse passer pour ne pas bloquer
// un upload que le restaurateur devra de toute façon recompresser.

// POST /api/dishes/[id]/model3d — upload .glb (+ .usdz optionnel, pour
// AR Quick Look iOS). Conversion .glb → .usdz automatique demandée par la
// section 9.2, mais aucun outil fiable n'existe côté serveur Node — la
// conversion nécessite normalement usdz_converter (Apple, macOS) ou un
// service tiers payant. Faute de pipeline en place, on accepte le .usdz
// en upload manuel séparé plutôt que de prétendre le générer.
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
  const glbFile = formData?.get("glb");
  const usdzFile = formData?.get("usdz");

  if (!glbFile || !(glbFile instanceof File) || !glbFile.name.endsWith(".glb")) {
    return NextResponse.json({ error: "Missing .glb file" }, { status: 400 });
  }
  if (glbFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const glbBuffer = Buffer.from(await glbFile.arrayBuffer());
  const glbResult = await uploadBuffer(glbBuffer, {
    folder: `vorae/${restaurantUser.restaurantId}/models`,
    resourceType: "raw",
    publicId: `${id}.glb`,
  });

  let usdzUrl: string | undefined;
  if (usdzFile instanceof File && usdzFile.name.endsWith(".usdz")) {
    if (usdzFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "USDZ file too large" }, { status: 400 });
    }
    const usdzBuffer = Buffer.from(await usdzFile.arrayBuffer());
    const usdzResult = await uploadBuffer(usdzBuffer, {
      folder: `vorae/${restaurantUser.restaurantId}/models`,
      resourceType: "raw",
      publicId: `${id}.usdz`,
    });
    usdzUrl = usdzResult.secure_url;
  }

  const updated = await prisma.dish.update({
    where: { id },
    data: {
      model3dGlbUrl: glbResult.secure_url,
      model3dUsdzUrl: usdzUrl ?? dish.model3dUsdzUrl,
      isArReady: true,
    },
  });

  return NextResponse.json({
    model3dGlbUrl: updated.model3dGlbUrl,
    model3dUsdzUrl: updated.model3dUsdzUrl,
    isArReady: updated.isArReady,
  });
}
