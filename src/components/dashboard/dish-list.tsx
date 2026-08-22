"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export type DashboardDish = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  isAvailable: boolean;
  isArReady: boolean;
};

export function DishList({ dishes: initialDishes }: { dishes: DashboardDish[] }) {
  const t = useTranslations("Dashboard.dishes");
  const router = useRouter();
  const [dishes, setDishes] = useState(initialDishes);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(
    () => Array.from(new Set(dishes.map((d) => d.category).filter((c): c is string => !!c))),
    [dishes]
  );

  const filtered = dishes.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function toggleAvailability(dish: DashboardDish) {
    const next = !dish.isAvailable;
    setDishes((prev) =>
      prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: next } : d))
    );
    await fetch(`/api/dishes/${dish.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: dish.name, price: dish.price, isAvailable: next }),
    });
  }

  async function handleDelete(dish: DashboardDish) {
    if (!confirm(t("confirmDelete"))) return;
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    await fetch(`/api/dishes/${dish.id}`, { method: "DELETE" });
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button asChild>
          <Link href="/dashboard/dishes/new">{t("addDish")}</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {filtered.map((dish) => (
            <div key={dish.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{dish.name}</span>
                <span className="text-xs text-muted-foreground">
                  {dish.category ?? "—"} · {dish.price.toFixed(2)} $ ·{" "}
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
          ))}
        </div>
      )}
    </div>
  );
}
