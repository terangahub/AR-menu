import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { DishList, type DashboardDish } from "@/components/dashboard/dish-list";

// Gestion des plats (section 10.2) - recherche, filtre par catégorie,
// disponibilité en un clic, réordonnancement (à venir).
export default async function DashboardDishesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.dishes");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const dishes = await prisma.dish.findMany({
    where: { restaurantId: restaurantUser.restaurantId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      nameEn: true,
      category: true,
      categoryEn: true,
      price: true,
      isAvailable: true,
      isArReady: true,
    },
  });

  const dashboardDishes: DashboardDish[] = dishes.map((d) => ({
    ...d,
    price: Number(d.price),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <DishList dishes={dashboardDishes} locale={locale} />
    </div>
  );
}
