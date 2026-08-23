import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { dishInputSchema } from "@/lib/dish-schema";

// GET/POST /api/dishes — CRUD plats du dashboard restaurateur (section 9.2,
// 10.2). Scopé au restaurant de l'utilisateur connecté (RBAC, section 17.2).
export async function GET() {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dishes = await prisma.dish.findMany({
    where: { restaurantId: restaurantUser.restaurantId },
    orderBy: { createdAt: "asc" },
    include: {
      allergens: { select: { allergen: true } },
    },
  });

  return NextResponse.json(
    dishes.map((d) => ({
      ...d,
      price: Number(d.price),
      allergens: d.allergens.map((a) => a.allergen),
    }))
  );
}

export async function POST(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = dishInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { allergenCodes, ...data } = parsed.data;

  const dish = await prisma.dish.create({
    data: {
      ...data,
      restaurantId: restaurantUser.restaurantId,
      isArReady: false,
      allergens: allergenCodes?.length
        ? {
            create: allergenCodes.map((code) => ({
              allergen: { connect: { code } },
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ ...dish, price: Number(dish.price) }, { status: 201 });
}
