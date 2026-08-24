import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/scan";
import { MenuClient, type MenuDish } from "@/components/menu/menu-client";

// Menu 2D public (F02) - fallback obligatoire, jamais bloqué par l'AR
// (section 5.1, 17.1). GET /api/menu/[restaurantSlug] expose les mêmes
// données pour d'autres clients (section 9.1).
export default async function RestaurantMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; restaurantSlug: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { locale, restaurantSlug } = await params;
  const { qr } = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: {
      id: true,
      name: true,
      dishes: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          descriptionEn: true,
          category: true,
          categoryEn: true,
          price: true,
          imageUrl: true,
          isArReady: true,
          allergens: {
            select: {
              allergen: { select: { code: true, nameFr: true, nameEn: true } },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  if (qr) {
    // Best-effort - un QR code invalide ou une limite de débit atteinte ne
    // doit jamais empêcher l'affichage du menu.
    await recordScan({ qrCodeId: qr }).catch(() => undefined);
  }

  const dishes: MenuDish[] = restaurant.dishes.map((d) => ({
    ...d,
    price: Number(d.price),
    allergens: d.allergens.map((a) => a.allergen),
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {restaurant.name}
      </h1>
      <MenuClient
        restaurantSlug={restaurantSlug}
        dishes={dishes}
        locale={locale}
        qr={qr}
      />
    </main>
  );
}
