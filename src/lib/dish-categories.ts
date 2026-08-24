import { prisma } from "@/lib/prisma";

// Catégories déjà utilisées par ce restaurant - alimente le menu déroulant
// du formulaire plat (évite les doublons du type "Plats"/"plats"/"Plat").
export async function getExistingCategories(restaurantId: string) {
  const dishes = await prisma.dish.findMany({
    where: { restaurantId, category: { not: null } },
    select: { category: true, categoryEn: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return dishes
    .filter((d): d is { category: string; categoryEn: string | null } => d.category !== null)
    .map((d) => ({ category: d.category, categoryEn: d.categoryEn }));
}
