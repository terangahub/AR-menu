import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DishForm } from "@/components/dashboard/dish-form";

export default async function NewDishPage() {
  const t = await getTranslations("Dashboard.dishForm");
  const allergens = await prisma.allergen.findMany({ orderBy: { nameFr: "asc" } });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <DishForm mode="create" allergens={allergens} />
    </div>
  );
}
