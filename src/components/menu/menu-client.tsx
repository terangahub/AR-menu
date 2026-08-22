"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Allergen = { code: string; nameFr: string; nameEn: string };

export type MenuDish = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  category: string | null;
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
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(
    new Set()
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(dishes.map((d) => d.category).filter((c): c is string => !!c))
      ),
    [dishes]
  );

  const allergenOptions = useMemo(() => {
    const map = new Map<string, Allergen>();
    for (const d of dishes) {
      for (const a of d.allergens) map.set(a.code, a);
    }
    return Array.from(map.values());
  }, [dishes]);

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

  return (
    <div className="flex flex-col gap-6">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              category === "all"
                ? "bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            {t("categoryAll")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {allergenOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">{t("allergenFilter")}</span>
          {allergenOptions.map((a) => (
            <label key={a.code} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={excludedAllergens.has(a.code)}
                onChange={() => toggleAllergen(a.code)}
              />
              {locale === "en" ? a.nameEn : a.nameFr}
            </label>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dish) => (
            <Link
              key={dish.id}
              href={
                qr
                  ? `/${restaurantSlug}/dishes/${dish.id}?qr=${encodeURIComponent(qr)}`
                  : `/${restaurantSlug}/dishes/${dish.id}`
              }
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">
                  {locale === "en" && dish.nameEn ? dish.nameEn : dish.name}
                </h3>
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {dish.price.toFixed(2)} $
                </span>
              </div>
              {dish.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {dish.description}
                </p>
              )}
              {dish.isArReady && (
                <span className="mt-auto inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                  {t("viewInAr")}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
