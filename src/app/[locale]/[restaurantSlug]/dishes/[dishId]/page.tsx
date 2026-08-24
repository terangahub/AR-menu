import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/scan";
import { Link } from "@/i18n/navigation";
import { DishArSection } from "@/components/menu/dish-ar-section";

// Fiche plat (F05) : prix, ingrédients, allergènes, temps de préparation,
// affichage AR avec fallback 2D obligatoire (F03/F04, section 17.1).
export default async function DishPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; restaurantSlug: string; dishId: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { locale, restaurantSlug, dishId } = await params;
  const { qr } = await searchParams;
  const t = await getTranslations("Dish");

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      restaurant: { select: { slug: true } },
      allergens: {
        select: {
          allergen: { select: { code: true, nameFr: true, nameEn: true } },
        },
      },
    },
  });

  if (!dish || dish.restaurant.slug !== restaurantSlug || !dish.isAvailable) {
    notFound();
  }

  if (qr) {
    // Vue de la fiche plat, distincte de l'activation AR (voir
    // DishArSection) — nécessaire pour calculer le taux d'activation AR
    // (section 10.1/10.3 : activations AR ÷ vues de fiche plat).
    await recordScan({ qrCodeId: qr, dishId: dish.id }).catch(() => undefined);
  }

  const name = locale === "en" && dish.nameEn ? dish.nameEn : dish.name;
  const description =
    locale === "en" && dish.descriptionEn ? dish.descriptionEn : dish.description;
  const ingredients =
    locale === "en" && dish.ingredientsEn ? dish.ingredientsEn : dish.ingredients;
  const allergens = dish.allergens.map((a) => a.allergen);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Link
        href={`/${restaurantSlug}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {t("back")}
      </Link>

      <DishArSection
        dishId={dish.id}
        qrCodeId={qr}
        glbUrl={dish.model3dGlbUrl}
        usdzUrl={dish.model3dUsdzUrl}
        imageUrl={dish.imageUrl}
        alt={name}
      />

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <span className="whitespace-nowrap text-lg text-muted-foreground">
          {Number(dish.price).toFixed(2)} $
        </span>
      </div>

      {description && <p className="text-muted-foreground">{description}</p>}

      {ingredients && (
        <div>
          <h2 className="text-sm font-medium">{t("ingredients")}</h2>
          <p className="text-sm text-muted-foreground">{ingredients}</p>
        </div>
      )}

      {allergens.length > 0 && (
        <div>
          <h2 className="text-sm font-medium">{t("allergens")}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {allergens.map((a) => (
              <span
                key={a.code}
                className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive"
              >
                {locale === "en" ? a.nameEn : a.nameFr}
              </span>
            ))}
          </div>
        </div>
      )}

      {dish.prepTimeMinutes != null && (
        <div>
          <h2 className="text-sm font-medium">{t("prepTime")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("prepTimeMinutes", { minutes: dish.prepTimeMinutes })}
          </p>
        </div>
      )}
    </main>
  );
}
