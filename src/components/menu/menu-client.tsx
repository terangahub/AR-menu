"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArCubeIcon } from "./ar-cube-icon";
import { ChevronIcon, CloseIcon, GridViewIcon, ListViewIcon } from "./menu-icons";

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

type ViewMode = "grid" | "list";

// Le choix de vue est une préférence de confort, pas une donnée : il vit
// dans le navigateur du convive. Un menu de brasserie peut compter
// quarante plats, où la grille en photos oblige à un défilement
// interminable ; la liste compacte laisse voir dix plats d'un coup.
const VIEW_STORAGE_KEY = "vorae:menu-view";

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
  const [view, setView] = useState<ViewMode>("grid");

  const isEn = locale === "en";

  // Lu après le montage et jamais pendant le rendu : le serveur n'a pas
  // accès à localStorage, lire la préférence trop tôt ferait diverger le
  // HTML serveur du premier rendu client (erreur d'hydratation).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "grid" || stored === "list") setView(stored);
    } catch {
      // Navigation privée ou stockage bloqué : la vue grille par défaut
      // reste parfaitement utilisable, il n'y a rien à signaler.
    }
  }, []);

  function chooseView(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Voir ci-dessus : préférence non mémorisée, sans conséquence.
    }
  }

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

  const allergenLabel = (a: Allergen) => (isEn ? a.nameEn : a.nameFr);

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

  // Le nombre de plats masqués est dit explicitement : sans lui, un
  // convive qui exclut le gluten voit une carte plus courte sans savoir
  // si le restaurant propose peu de plats ou si son filtre en cache.
  const hiddenCount = dishes.length - filtered.length;
  const hasFilters = category !== "all" || excludedAllergens.size > 0;

  function clearFilters() {
    setCategory("all");
    setExcludedAllergens(new Set());
  }

  function dishHref(dishId: string) {
    return qr
      ? `/${restaurantSlug}/dishes/${dishId}?qr=${encodeURIComponent(qr)}`
      : `/${restaurantSlug}/dishes/${dishId}`;
  }

  return (
    <div className="flex flex-col">
      <div className="menu-sticky-bar">
        {/* Les catégories occupent leur propre ligne, sur toute la largeur.
            Elles partageaient auparavant la ligne du filtre allergènes, qui
            recouvrait la dernière catégorie sur un écran de téléphone : deux
            commandes de nature différente se disputaient la même place. */}
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pt-3 sm:-mx-6 sm:px-6">
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

        <div className="flex items-center justify-between gap-3 py-3">
          {allergenOptions.length > 0 ? (
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                excludedAllergens.size > 0
                  ? "border-foreground/25 bg-foreground/[0.06] text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {excludedAllergens.size > 0
                ? t("allergenFilterActive", { count: excludedAllergens.size })
                : t("allergenFilter")}
              <ChevronIcon
                className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <span />
          )}

          <div
            role="group"
            aria-label={t("viewLabel")}
            className="inline-flex shrink-0 items-center rounded-full border border-border p-0.5"
          >
            <ViewButton
              active={view === "grid"}
              onClick={() => chooseView("grid")}
              label={t("viewGrid")}
              icon={<GridViewIcon className="h-4 w-4" />}
            />
            <ViewButton
              active={view === "list"}
              onClick={() => chooseView("list")}
              label={t("viewList")}
              icon={<ListViewIcon className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Panneau déplié sous la barre plutôt qu'une liste de cases posée
            entre les commandes : les allergènes sont nombreux, ils ont
            besoin de place, et le convive doit voir d'un coup ce qu'il a
            écarté. Chaque allergène écarté reste affiché barré, avec une
            croix, pour être retiré sans rouvrir le panneau. */}
        {filtersOpen && allergenOptions.length > 0 && (
          <div className="border-t border-border/60 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t("allergenHint")}</p>
              {excludedAllergens.size > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludedAllergens(new Set())}
                  className="shrink-0 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t("allergenReset")}
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {allergenOptions.map((a) => {
                const excluded = excludedAllergens.has(a.code);
                return (
                  <button
                    key={a.code}
                    type="button"
                    aria-pressed={excluded}
                    onClick={() => toggleAllergen(a.code)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      excluded
                        ? "border-destructive/45 bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    <span className={excluded ? "line-through" : undefined}>
                      {allergenLabel(a)}
                    </span>
                    {excluded && <CloseIcon className="h-3 w-3" />}
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
          {hiddenCount > 0 && (
            <span className="text-muted-foreground/70">
              {" "}
              {t("hiddenCount", { count: hiddenCount })}
            </span>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
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
      ) : view === "grid" ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              href={dishHref(dish.id)}
              isEn={isEn}
              arLabel={t("viewInAr")}
            />
          ))}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {filtered.map((dish) => (
            <li key={dish.id}>
              <DishRow
                dish={dish}
                href={dishHref(dish.id)}
                isEn={isEn}
                arLabel={t("viewInAr")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DishCard({
  dish,
  href,
  isEn,
  arLabel,
}: {
  dish: MenuDish;
  href: string;
  isEn: boolean;
  arLabel: string;
}) {
  const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
  const description = isEn && dish.descriptionEn ? dish.descriptionEn : dish.description;

  return (
    <Link
      href={href}
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
          <DishInitial name={name} className="text-5xl" />
        )}

        <div className="photo-scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/3" />

        {dish.isArReady && (
          <span className="photo-chip absolute right-3 top-3">
            <ArCubeIcon className="h-3.5 w-3.5" />
            {arLabel}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <h3 className="font-heading text-lg leading-tight text-white drop-shadow-sm">{name}</h3>
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
}

// Vue liste : conçue pour parcourir une longue carte, pas pour admirer les
// photos. La vignette reste carrée et petite, le nom et le prix sont
// alignés sur une seule ligne, et la description est coupée à une ligne :
// dix plats tiennent à l'écran là où la grille en montrait deux.
function DishRow({
  dish,
  href,
  isEn,
  arLabel,
}: {
  dish: MenuDish;
  href: string;
  isEn: boolean;
  arLabel: string;
}) {
  const name = isEn && dish.nameEn ? dish.nameEn : dish.name;
  const description = isEn && dish.descriptionEn ? dish.descriptionEn : dish.description;

  return (
    <Link
      href={href}
      className="surface-menu surface-menu-interactive group flex items-center gap-3.5 p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-4 sm:p-3"
    >
      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20">
        {dish.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <DishInitial name={name} className="text-2xl" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-[17px] leading-tight">{name}</h3>
          {dish.isArReady && (
            <span
              title={arLabel}
              aria-label={arLabel}
              className="inline-flex shrink-0 items-center rounded-full border border-border/70 p-1 text-muted-foreground"
            >
              <ArCubeIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        {description && (
          <p className="truncate text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {dish.allergens.length > 0 && (
          <p className="truncate text-[11px] text-muted-foreground/75">
            {dish.allergens.map((a) => (isEn ? a.nameEn : a.nameFr)).join(" · ")}
          </p>
        )}
      </div>

      <span className="shrink-0 self-start pt-0.5 font-heading text-base tabular-nums">
        {dish.price.toFixed(2)} $
      </span>
    </Link>
  );
}

// Un plat sans photo ne doit pas laisser un trou gris : l'initiale sur un
// fond neutre reste présentable, et la vignette garde la même taille que
// les autres.
function DishInitial({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-foreground/[0.07] to-foreground/[0.02]">
      <span className={`font-heading text-foreground/20 ${className}`}>
        {name.charAt(0).toUpperCase()}
      </span>
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

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
