"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export type DashboardDish = {
  id: string;
  name: string;
  nameEn: string | null;
  category: string | null;
  categoryEn: string | null;
  price: number;
  isAvailable: boolean;
  isArReady: boolean;
};

export function DishList({
  dishes: initialDishes,
  locale,
}: {
  dishes: DashboardDish[];
  locale: string;
}) {
  const t = useTranslations("Dashboard.dishes");
  const router = useRouter();
  const [dishes, setDishes] = useState(initialDishes);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // La clé de filtrage reste la catégorie française (canonique) — seul le
  // libellé affiché change selon la locale du dashboard.
  const categories = useMemo(() => {
    const labelByCategory = new Map<string, string>();
    for (const d of dishes) {
      if (!d.category) continue;
      if (!labelByCategory.has(d.category)) {
        labelByCategory.set(
          d.category,
          locale === "en" && d.categoryEn ? d.categoryEn : d.category
        );
      }
    }
    return Array.from(labelByCategory.entries());
  }, [dishes, locale]);

  const filtered = dishes.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function toggleAvailability(dish: DashboardDish) {
    const next = !dish.isAvailable;
    setError(null);
    setDishes((prev) =>
      prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: next } : d))
    );
    const res = await fetch(`/api/dishes/${dish.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: dish.name, price: dish.price, isAvailable: next }),
    });
    if (!res.ok) {
      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: !next } : d))
      );
      setError(t("error"));
    }
  }

  async function handleDelete(dish: DashboardDish) {
    if (!confirm(t("confirmDelete"))) return;
    setError(null);
    const previous = dishes;
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    const res = await fetch(`/api/dishes/${dish.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDishes(previous);
      setError(t("error"));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">{t("allCategories")}</option>
            {categories.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button asChild>
          <Link href="/dashboard/dishes/new">{t("addDish")}</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {filtered.map((dish) => {
            const name = locale === "en" && dish.nameEn ? dish.nameEn : dish.name;
            const categoryLabel =
              (locale === "en" && dish.categoryEn ? dish.categoryEn : dish.category) ?? "—";

            return (
            <div key={dish.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryLabel} · {dish.price.toFixed(2)} $ ·{" "}
                  {dish.isArReady ? t("arReady") : t("noModel")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={dish.isAvailable}
                    onChange={() => toggleAvailability(dish)}
                  />
                  {dish.isAvailable ? t("available") : t("unavailable")}
                </label>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/dishes/${dish.id}/edit`}>{t("edit")}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(dish)}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
