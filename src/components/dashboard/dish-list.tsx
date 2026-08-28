"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/ui";
import { ArCubeIcon } from "@/components/menu/ar-cube-icon";

export type DashboardDish = {
  id: string;
  name: string;
  nameEn: string | null;
  category: string | null;
  categoryEn: string | null;
  price: number;
  imageUrl: string | null;
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

  const isEn = locale === "en";

  // La clé de filtrage reste la catégorie française (canonique) - seul le
  // libellé affiché change selon la locale du dashboard.
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

  const filtered = dishes.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (search) {
      // La recherche ne portait que sur le nom français : en anglais, le
      // restaurateur tapait le nom qu'il voyait à l'écran et n'obtenait
      // rien. Les deux noms sont interrogés, quelle que soit la langue.
      const needle = search.toLowerCase();
      const haystack = `${d.name} ${d.nameEn ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const hasFilters = search.length > 0 || category !== "all";

  async function toggleAvailability(dish: DashboardDish) {
    const next = !dish.isAvailable;
    setError(null);
    setDishes((prev) => prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: next } : d)));
    const res = await fetch(`/api/dishes/${dish.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: dish.name, price: dish.price, isAvailable: next }),
    });
    if (!res.ok) {
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: !next } : d)));
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
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="input min-w-[180px] flex-1 sm:max-w-xs"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input shrink-0"
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
        // Deux vides très différents : une carte encore vide appelle un
        // premier plat, une recherche sans résultat appelle un filtre
        // moins strict. Les confondre laissait un restaurateur devant
        // "Aucun plat ne correspond" alors qu'il n'en avait jamais créé.
        hasFilters ? (
          <EmptyState title={t("emptyFiltered")} description={t("emptyFilteredHint")} />
        ) : (
          <EmptyState
            title={t("emptyFirst")}
            description={t("emptyFirstHint")}
            actionLabel={t("addDish")}
            actionHref="/dashboard/dishes/new"
          />
        )
      ) : (
        <ul className="surface-panel divide-y divide-border/60">
          {filtered.map((dish) => {
            const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
            const categoryLabel = isEn && dish.categoryEn ? dish.categoryEn : dish.category;

            return (
              <li
                key={dish.id}
                className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
              >
                {/* Le lien ne couvre que la vignette et le bloc de texte :
                    une ligne entière cliquable engloberait la bascule de
                    disponibilité et le bouton Supprimer. */}
                <Link
                  href={`/dashboard/dishes/${dish.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60">
                    {dish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dish.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-foreground/[0.05]">
                        <span className="font-heading text-base text-foreground/25">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{name}</span>
                      {dish.isArReady && (
                        <span
                          title={t("arReady")}
                          aria-label={t("arReady")}
                          className="inline-flex shrink-0 items-center rounded-full border border-border/70 p-1 text-muted-foreground"
                        >
                          <ArCubeIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {!dish.isAvailable && (
                        <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t("unavailable")}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {[categoryLabel, `${dish.price.toFixed(2)} $`, dish.isArReady ? null : t("noModel")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  <AvailabilityToggle
                    checked={dish.isAvailable}
                    label={t("available")}
                    onChange={() => toggleAvailability(dish)}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/dishes/${dish.id}/edit`}>{t("edit")}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(dish)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Une case à cocher nue ne dit pas ce qu'elle commande tant qu'on n'a pas
// lu son étiquette, et son étiquette changeait de texte selon son état, ce
// qui rendait la colonne illisible d'un coup d'oeil. L'interrupteur montre
// son état par sa position, avec un libellé stable.
function AvailabilityToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-success" : "bg-foreground/20"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
