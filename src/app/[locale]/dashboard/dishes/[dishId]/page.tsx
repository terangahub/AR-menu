import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArViewer } from "@/components/menu/ar-viewer";
import { DishMedia } from "@/components/dashboard/dish-media";
import { DishScan } from "@/components/dashboard/dish-scan";

// Fiche plat côté dashboard : ce que contient le plat, son visuel, son
// modèle 3D et les actions possibles, réunis au même endroit. La liste
// des plats n'ouvrait auparavant que le formulaire d'édition, sans
// jamais permettre de simplement regarder un plat.
export default async function DashboardDishPage({
  params,
}: {
  params: Promise<{ locale: string; dishId: string }>;
}) {
  const { locale, dishId } = await params;
  const t = await getTranslations("Dashboard.dishDetail");
  const tList = await getTranslations("Dashboard.dishes");
  const restaurantUser = await getCurrentRestaurantUser();

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      restaurant: { select: { slug: true } },
      allergens: { select: { allergen: { select: { code: true, nameFr: true, nameEn: true } } } },
    },
  });

  if (!dish || !restaurantUser || dish.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const isEn = locale === "en";
  const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
  const description = isEn && dish.descriptionEn ? dish.descriptionEn : dish.description;
  const category = isEn && dish.categoryEn ? dish.categoryEn : dish.category;
  const ingredients = isEn && dish.ingredientsEn ? dish.ingredientsEn : dish.ingredients;

  // Chaque ligne n'est rendue que si elle a une valeur : une fiche
  // criblée de tirets ne dit rien de plus qu'une fiche courte.
  const facts: { label: string; value: string }[] = [
    { label: t("price"), value: `${Number(dish.price).toFixed(2)} $` },
    ...(category ? [{ label: t("category"), value: category }] : []),
    ...(dish.prepTimeMinutes != null
      ? [{ label: t("prepTime"), value: t("minutes", { minutes: dish.prepTimeMinutes }) }]
      : []),
    {
      label: t("availability"),
      value: dish.isAvailable ? tList("available") : tList("unavailable"),
    },
    { label: t("ar"), value: dish.isArReady ? tList("arReady") : tList("noModel") },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard/dishes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("backToList")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/dishes/${dish.id}/edit`}>{tList("edit")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/analytics/${dish.id}`}>{t("analytics")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${dish.restaurant.slug}/dishes/${dish.id}`}>{t("publicPage")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("photo")}</span>
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={name}
              className="aspect-square w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t("noPhoto")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("model")}</span>
          {dish.model3dGlbUrl ? (
            <ArViewer
              glbUrl={dish.model3dGlbUrl}
              usdzUrl={dish.model3dUsdzUrl}
              imageUrl={dish.imageUrl}
              alt={name}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t("noModelYet")}
            </p>
          )}
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-border p-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="text-sm">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {description && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">{t("description")}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </section>
      )}

      {ingredients && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">{t("ingredients")}</h2>
          <p className="text-sm text-muted-foreground">{ingredients}</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("allergens")}</h2>
        {dish.allergens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAllergens")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {dish.allergens.map(({ allergen }) => (
              <li
                key={allergen.code}
                className="rounded-full border border-border px-3 py-1 text-xs"
              >
                {isEn ? allergen.nameEn : allergen.nameFr}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DishMedia
        dishId={dish.id}
        imageUrl={dish.imageUrl}
        model3dGlbUrl={dish.model3dGlbUrl}
        model3dUsdzUrl={dish.model3dUsdzUrl}
      />
      <DishScan dishId={dish.id} />
    </div>
  );
}
