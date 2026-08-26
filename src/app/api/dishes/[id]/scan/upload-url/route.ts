import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

// POST /api/dishes/[id]/scan/upload-url - renvoie les paramètres signés
// pour un upload direct vers Cloudinary, à appeler AVANT
// /api/dishes/[id]/scan. La vidéo ne doit jamais transiter par une
// Vercel Function : leur limite de payload (~4,5 Mo) est bien en-deçà
// de ce que pèse toute vidéo de scan utilisable (voir CONTEXT.md
// section 5, découvert via un vrai test en 413 FUNCTION_PAYLOAD_TOO_LARGE).
export async function POST(
  req: Request,
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

  const body = await req.json().catch(() => null);
  const resourceType = body?.resourceType === "image" ? "image" : "video";

  // Message renvoyé tel quel : sans lui, une configuration Cloudinary
  // absente se traduit par un 500 au corps vide, indiagnosticable depuis
  // le navigateur. signUpload ne cite que des noms de variables, jamais
  // leur valeur.
  try {
    const signed = signUpload({
      folder: `vorae/${restaurantUser.restaurantId}/scan-sources`,
      publicId: `${id}-${randomUUID()}`,
      resourceType,
    });
    return NextResponse.json(signed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signature impossible" },
      { status: 500 }
    );
  }
}
