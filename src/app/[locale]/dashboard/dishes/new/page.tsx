import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { DishForm } from "@/components/dashboard/dish-form";
import { getExistingCategories } from "@/lib/dish-categories";

export default async function NewDishPage() {
  const t = await getTranslations("Dashboard.dishForm");
  const restaurantUser = await getCurrentRestaurantUser();
  const [allergens, existingCategories] = await Promise.all([
    prisma.allergen.findMany({ orderBy: { nameFr: "asc" } }),
    restaurantUser ? getExistingCategories(restaurantUser.restaurantId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <DishForm mode="create" allergens={allergens} existingCategories={existingCategories} />
    </div>
  );
}
