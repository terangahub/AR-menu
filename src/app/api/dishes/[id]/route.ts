import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dishes/[id] — fiche plat + AR (section 9.1, F05).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dish = await prisma.dish.findUnique({
    where: { id },
    select: {
      id: true,
      restaurantId: true,
      name: true,
      nameEn: true,
      description: true,
      category: true,
      ingredients: true,
      prepTimeMinutes: true,
      price: true,
      imageUrl: true,
      model3dGlbUrl: true,
      model3dUsdzUrl: true,
      isArReady: true,
      isAvailable: true,
      allergens: {
        select: {
          allergen: { select: { code: true, nameFr: true, nameEn: true } },
        },
      },
    },
  });

  if (!dish) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...dish,
    price: Number(dish.price),
    allergens: dish.allergens.map((a) => a.allergen),
  });
}
