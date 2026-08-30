import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { DishForm, type DishFormValues } from "@/components/dashboard/dish-form";
import { getExistingCategories } from "@/lib/dish-categories";
import { PageHeader } from "@/components/dashboard/ui";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { dishId } = await params;
  const t = await getTranslations("Dashboard.dishForm");
  const restaurantUser = await getCurrentRestaurantUser();

  const [dish, allergens] = await Promise.all([
    prisma.dish.findUnique({
      where: { id: dishId },
      include: { allergens: { select: { allergen: { select: { code: true } } } } },
    }),
    prisma.allergen.findMany({ orderBy: { nameFr: "asc" } }),
  ]);

  if (!dish || !restaurantUser || dish.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const existingCategories = await getExistingCategories(restaurantUser.restaurantId);

  const initialValues: Partial<DishFormValues> = {
    name: dish.name,
    nameEn: dish.nameEn ?? "",
    description: dish.description ?? "",
    descriptionEn: dish.descriptionEn ?? "",
    category: dish.category ?? "",
    categoryEn: dish.categoryEn ?? "",
    ingredients: dish.ingredients ?? "",
    ingredientsEn: dish.ingredientsEn ?? "",
    price: String(dish.price),
    prepTimeMinutes: dish.prepTimeMinutes != null ? String(dish.prepTimeMinutes) : "",
    isAvailable: dish.isAvailable,
    allergenCodes: dish.allergens.map((a) => a.allergen.code),
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Les médias et le scan 3D vivent sur la fiche du plat, pas ici :
          cette page ne sert qu'à modifier les champs. */}
      <Link
        href={`/dashboard/dishes/${dish.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden>&larr;</span>
        {t("backToDish")}
      </Link>
      <PageHeader title={t("editTitle")} description={t("editSubtitle")} />
      <DishForm
        mode="edit"
        dishId={dish.id}
        initialValues={initialValues}
        allergens={allergens}
        existingCategories={existingCategories}
      />
    </div>
  );
}
