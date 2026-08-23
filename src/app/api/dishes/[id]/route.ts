import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { dishInputSchema } from "@/lib/dish-schema";

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
      descriptionEn: true,
      category: true,
      categoryEn: true,
      ingredients: true,
      ingredientsEn: true,
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

// PUT/DELETE /api/dishes/[id] — CRUD dashboard (section 9.2, 10.2). Scopés
// au restaurant de l'utilisateur connecté (RBAC, section 17.2).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.dish.findUnique({ where: { id } });
  if (!existing || existing.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = dishInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { allergenCodes, ...data } = parsed.data;

  const dish = await prisma.$transaction(async (tx) => {
    if (allergenCodes) {
      await tx.dishAllergen.deleteMany({ where: { dishId: id } });
      if (allergenCodes.length > 0) {
        const allergens = await tx.allergen.findMany({
          where: { code: { in: allergenCodes } },
          select: { id: true },
        });
        await tx.dishAllergen.createMany({
          data: allergens.map((a) => ({ dishId: id, allergenId: a.id })),
          skipDuplicates: true,
        });
      }
    }
    return tx.dish.update({ where: { id }, data });
  });

  return NextResponse.json({ ...dish, price: Number(dish.price) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.dish.findUnique({ where: { id } });
  if (!existing || existing.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }

  await prisma.dishAllergen.deleteMany({ where: { dishId: id } });
  await prisma.dish.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
