import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/scan";
import { Link } from "@/i18n/navigation";
import { DishArSection } from "@/components/menu/dish-ar-section";
import { LocaleSwitch } from "@/components/locale-switch";
import { ThemeToggle } from "@/components/theme-toggle";

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
      restaurant: { select: { slug: true, name: true } },
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
    // DishArSection) - nécessaire pour calculer le taux d'activation AR
    // (section 10.1/10.3 : activations AR ÷ vues de fiche plat).
    await recordScan({ qrCodeId: qr, dishId: dish.id }).catch(() => undefined);
  }

  const isEn = locale === "en";
  const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
  const description = isEn && dish.descriptionEn ? dish.descriptionEn : dish.description;
  const ingredients = isEn && dish.ingredientsEn ? dish.ingredientsEn : dish.ingredients;
  const category = isEn && dish.categoryEn ? dish.categoryEn : dish.category;
  const allergens = dish.allergens.map((a) => a.allergen);

  // Le lien de retour conserve le QR : sans lui, revenir au menu perdrait
  // le rattachement de la visite à la table, et fausserait les statistiques.
  const backHref = qr
    ? `/${restaurantSlug}?qr=${encodeURIComponent(qr)}`
    : `/${restaurantSlug}`;

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="menu-aurora pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />

      <main className="relative mx-auto flex max-w-3xl flex-col px-4 pb-20 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <span aria-hidden>&larr;</span>
            {t("back")}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>

        <DishArSection
          dishId={dish.id}
          qrCodeId={qr}
          glbUrl={dish.model3dGlbUrl}
          usdzUrl={dish.model3dUsdzUrl}
          imageUrl={dish.imageUrl}
          alt={name}
        />

        <div className="mt-8 flex flex-col gap-3">
          {category && (
            <span className="w-fit rounded-full border border-border/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {category}
            </span>
          )}
          <div className="flex items-start justify-between gap-6">
            <h1 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
              {name}
            </h1>
            <span className="shrink-0 pt-1 font-heading text-2xl tabular-nums text-foreground">
              {Number(dish.price).toFixed(2)} $
            </span>
          </div>
          {description && (
            <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Les allergènes en premier et en pleine largeur : c'est
            l'information dont dépend une décision de santé, elle ne se
            traite pas comme une ligne de détail parmi d'autres. */}
        {allergens.length > 0 && (
          <section className="mt-8 rounded-card border border-destructive/25 bg-destructive/[0.06] p-4">
            <h2 className="text-sm font-medium text-destructive">{t("allergens")}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {allergens.map((a) => (
                <span
                  key={a.code}
                  className="rounded-full border border-destructive/30 bg-background/60 px-3 py-1 text-sm text-destructive"
                >
                  {isEn ? a.nameEn : a.nameFr}
                </span>
              ))}
            </div>
          </section>
        )}

        {(ingredients || dish.prepTimeMinutes != null) && (
          <section className="surface-menu mt-6 grid divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {ingredients && (
              <div className="p-4">
                <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("ingredients")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed">{ingredients}</p>
              </div>
            )}
            {dish.prepTimeMinutes != null && (
              <div className="p-4">
                <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("prepTime")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed">
                  {t("prepTimeMinutes", { minutes: dish.prepTimeMinutes })}
                </p>
              </div>
            )}
          </section>
        )}

        <Link
          href={backHref}
          className="mt-10 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          <span aria-hidden>&larr;</span>
          {t("backToMenu", { restaurant: dish.restaurant.name })}
        </Link>
      </main>
    </div>
  );
}
