import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/menu/[restaurantSlug] — menu public 2D (section 9.1, F02).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  const { restaurantSlug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      defaultLocale: true,
      dishes: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          category: true,
          price: true,
          imageUrl: true,
          isArReady: true,
          allergens: {
            select: {
              allergen: {
                select: { code: true, nameFr: true, nameEn: true },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const { dishes, ...restaurantInfo } = restaurant;

  return NextResponse.json({
    restaurant: restaurantInfo,
    dishes: dishes.map((d) => ({
      ...d,
      price: Number(d.price),
      allergens: d.allergens.map((a) => a.allergen),
    })),
  });
}
