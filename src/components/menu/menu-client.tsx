"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArCubeIcon } from "./ar-cube-icon";

type Allergen = { code: string; nameFr: string; nameEn: string };

export type MenuDish = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  category: string | null;
  categoryEn: string | null;
  price: number;
  imageUrl: string | null;
  isArReady: boolean;
  allergens: Allergen[];
};

export function MenuClient({
  restaurantSlug,
  dishes,
  locale,
  qr,
}: {
  restaurantSlug: string;
  dishes: MenuDish[];
  locale: string;
  qr?: string;
}) {
  const t = useTranslations("Menu");
  const [category, setCategory] = useState<string>("all");
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isEn = locale === "en";

  // La clé de filtrage reste toujours la catégorie française (canonique) :
  // seul le libellé affiché change selon la locale, via categoryEn.
  const categories = useMemo(() => {
    const labelByCategory = new Map<string, string>();
    for (const d of dishes) {
      if (!d.category) continue;
      if (!labelByCategory.has(d.category)) {
        labelByCategory.set(d.category, isEn && d.categoryEn ? d.categoryEn : d.category);
      }
    }
    return Array.from(labelByCategory.entries());
  }, [dishes, isEn]);

  const allergenOptions = useMemo(() => {
    const map = new Map<string, Allergen>();
    for (const d of dishes) {
      for (const a of d.allergens) map.set(a.code, a);
    }
    return Array.from(map.values()).sort((a, b) =>
      (isEn ? a.nameEn : a.nameFr).localeCompare(isEn ? b.nameEn : b.nameFr)
    );
  }, [dishes, isEn]);

  function toggleAllergen(code: string) {
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const filtered = dishes.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (d.allergens.some((a) => excludedAllergens.has(a.code))) return false;
    return true;
  });

  const hasFilters = category !== "all" || excludedAllergens.size > 0;

  function clearFilters() {
    setCategory("all");
    setExcludedAllergens(new Set());
  }

  return (
    <div className="flex flex-col">
      <div className="menu-sticky-bar py-3">
        <div className="flex items-center gap-2">
          {/* Défilement horizontal plutôt qu'un retour à la ligne : sur un
              téléphone, une dizaine de catégories qui s'empilent
              repousseraient les plats sous la ligne de flottaison. */}
          <div className="scrollbar-none -mx-1 flex flex-1 gap-2 overflow-x-auto px-1">
            <CategoryPill
              active={category === "all"}
              onClick={() => setCategory("all")}
              label={t("categoryAll")}
            />
            {categories.map(([key, label]) => (
              <CategoryPill
                key={key}
                active={category === key}
                onClick={() => setCategory(key)}
                label={label}
              />
            ))}
          </div>

          {allergenOptions.length > 0 && (
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                excludedAllergens.size > 0
                  ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {excludedAllergens.size > 0
                ? t("allergenFilterActive", { count: excludedAllergens.size })
                : t("allergenFilter")}
            </button>
          )}
        </div>

        {filtersOpen && allergenOptions.length > 0 && (
          <div className="border-t border-border/60 py-3">
            <p className="mb-2 text-xs text-muted-foreground">{t("allergenHint")}</p>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((a) => {
                const excluded = excludedAllergens.has(a.code);
                return (
                  <button
                    key={a.code}
                    type="button"
                    aria-pressed={excluded}
                    onClick={() => toggleAllergen(a.code)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      excluded
                        ? "border-destructive/50 bg-destructive/10 text-destructive line-through"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {isEn ? a.nameEn : a.nameFr}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-4 pt-6">
        <p className="text-sm text-muted-foreground">
          {t("dishCount", { count: filtered.length })}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border px-6 py-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dish) => {
            const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
            const description =
              isEn && dish.descriptionEn ? dish.descriptionEn : dish.description;

            return (
              <Link
                key={dish.id}
                href={
                  qr
                    ? `/${restaurantSlug}/dishes/${dish.id}?qr=${encodeURIComponent(qr)}`
                    : `/${restaurantSlug}/dishes/${dish.id}`
                }
                className="surface-menu surface-menu-interactive group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {dish.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dish.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    // Un plat sans photo ne doit pas laisser un trou gris :
                    // l'initiale sur un fond de marque reste présentable, et
                    // la carte garde la même hauteur que les autres.
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-foreground/[0.07] to-foreground/[0.02]">
                      <span className="font-heading text-5xl text-foreground/20">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="photo-scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/3" />

                  {dish.isArReady && (
                    <span className="photo-chip absolute right-3 top-3">
                      <ArCubeIcon className="h-3.5 w-3.5" />
                      {t("viewInAr")}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <h3 className="font-heading text-lg leading-tight text-white drop-shadow-sm">
                      {name}
                    </h3>
                    <span className="photo-chip shrink-0 text-sm tabular-nums">
                      {dish.price.toFixed(2)} $
                    </span>
                  </div>
                </div>

                {(description || dish.allergens.length > 0) && (
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    {description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {dish.allergens.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {dish.allergens.map((a) => (
                          <span
                            key={a.code}
                            className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {isEn ? a.nameEn : a.nameFr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
