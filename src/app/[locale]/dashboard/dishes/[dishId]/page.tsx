import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArViewer } from "@/components/menu/ar-viewer";
import { DishMedia } from "@/components/dashboard/dish-media";
import { DishScan } from "@/components/dashboard/dish-scan";
import { Panel } from "@/components/dashboard/ui";
import { ModelReport } from "@/components/dashboard/model-report";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard/dishes"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden>&larr;</span>
            {t("backToList")}
          </Link>
          <h1 className="font-heading text-2xl leading-tight tracking-tight sm:text-3xl">
            {name}
          </h1>
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

      {/* Photo et modèle 3D côte à côte au même ratio : c'est la seule
          façon de voir d'un coup d'oeil si la capture rend bien le plat,
          ce qui est exactement la question que se pose le restaurateur en
          ouvrant cet écran. Ils étaient auparavant l'un carré et l'autre
          en 4:3, ce qui rendait la comparaison inutilisable. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title={t("photo")}>
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={name}
              className="aspect-[4/3] w-full rounded-xl border border-border/60 object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("noPhoto")}
            </div>
          )}
        </Panel>

        <Panel title={t("model")}>
          {dish.model3dGlbUrl ? (
            <ArViewer
              glbUrl={dish.model3dGlbUrl}
              usdzUrl={dish.model3dUsdzUrl}
              imageUrl={dish.imageUrl}
              alt={name}
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("noModelYet")}
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {(description || ingredients) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {description && (
            <Panel title={t("description")}>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Panel>
          )}
          {ingredients && (
            <Panel title={t("ingredients")}>
              <p className="text-sm leading-relaxed text-muted-foreground">{ingredients}</p>
            </Panel>
          )}
        </div>
      )}

      <Panel title={t("allergens")}>
        {dish.allergens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAllergens")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {dish.allergens.map(({ allergen }) => (
              <li
                key={allergen.code}
                className="rounded-full border border-destructive/30 px-3 py-1 text-xs text-destructive"
              >
                {isEn ? allergen.nameEn : allergen.nameFr}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <DishMedia
        dishId={dish.id}
        imageUrl={dish.imageUrl}
        model3dGlbUrl={dish.model3dGlbUrl}
        model3dUsdzUrl={dish.model3dUsdzUrl}
      />
      <DishScan dishId={dish.id} />
      {dish.model3dGlbUrl && <ModelReport dishId={dish.id} />}
    </div>
  );
}
