"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/ui";
import { ArCubeIcon } from "@/components/menu/ar-cube-icon";
import { GridViewIcon, ListViewIcon } from "@/components/menu/menu-icons";
import { DeleteButton } from "@/components/dashboard/delete-button";

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

type ViewMode = "grid" | "list";

// Même préférence que côté convive, clé distincte : un restaurateur qui
// gère quarante plats ne veut pas la même densité que le convive qui les
// consulte, et les deux écrans ne sont pas ouverts au même moment.
const VIEW_STORAGE_KEY = "vorae:dashboard-dishes-view";

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
  const [view, setView] = useState<ViewMode>("list");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEn = locale === "en";

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "grid" || stored === "list") setView(stored);
    } catch {
      // Stockage bloqué : la vue liste par défaut reste utilisable.
    }
  }, []);

  function chooseView(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Voir ci-dessus.
    }
  }

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
      const haystack = `${d.name} ${d.nameEn ?? ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
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

  function labelsFor(dish: DashboardDish) {
    return {
      name: isEn && dish.nameEn ? dish.nameEn : dish.name,
      category: isEn && dish.categoryEn ? dish.categoryEn : dish.category,
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="input min-w-[160px] flex-1 sm:max-w-xs"
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

        <div
          role="group"
          aria-label={t("viewLabel")}
          className="ml-auto inline-flex shrink-0 items-center rounded-full border border-border p-0.5"
        >
          <ViewButton
            active={view === "list"}
            onClick={() => chooseView("list")}
            label={t("viewList")}
            icon={<ListViewIcon className="h-4 w-4" />}
          />
          <ViewButton
            active={view === "grid"}
            onClick={() => chooseView("grid")}
            label={t("viewGrid")}
            icon={<GridViewIcon className="h-4 w-4" />}
          />
        </div>

        <Button asChild className="shrink-0">
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
      ) : view === "list" ? (
        <ul className="surface-panel divide-y divide-border/60">
          {filtered.map((dish) => (
            <li key={dish.id} className="p-3 sm:p-4">
              <DishRow
                dish={dish}
                {...labelsFor(dish)}
                onToggle={() => toggleAvailability(dish)}
                onDelete={() => handleDelete(dish)}
                deleting={isPending}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dish) => (
            <li key={dish.id}>
              <DishCard
                dish={dish}
                {...labelsFor(dish)}
                onToggle={() => toggleAvailability(dish)}
                onDelete={() => handleDelete(dish)}
                deleting={isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ItemProps = {
  dish: DashboardDish;
  name: string;
  category: string | null;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
};

// Sur un téléphone, le nom, l'interrupteur, Modifier et Supprimer tenaient
// sur une seule ligne : les actions étant `shrink-0`, elles prenaient toute
// la largeur et le nom du plat se réduisait à sa première lettre, tandis
// que la pastille "Indisponible" débordait par-dessus l'interrupteur. Les
// actions passent donc sous le nom tant que la largeur ne suffit pas.
function DishRow({ dish, name, category, onToggle, onDelete, deleting }: ItemProps) {
  const t = useTranslations("Dashboard.dishes");

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <Link
        href={`/dashboard/dishes/${dish.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75"
      >
        <Thumbnail imageUrl={dish.imageUrl} name={name} className="h-12 w-12" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{name}</span>
            {dish.isArReady && <ArBadge label={t("arReady")} />}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {[category, `${dish.price.toFixed(2)} $`, dish.isArReady ? null : t("noModel")]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2 pl-[60px] md:pl-0">
        <AvailabilityToggle
          checked={dish.isAvailable}
          onLabel={t("available")}
          offLabel={t("unavailable")}
          onChange={onToggle}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/dishes/${dish.id}/edit`}>{t("edit")}</Link>
        </Button>
        <DeleteButton label={t("delete")} onClick={onDelete} disabled={deleting} />
      </div>
    </div>
  );
}

// Vue grille : la photo d'abord, comme sur le menu public. Utile pour
// vérifier d'un coup d'oeil quels plats ont une photo présentable, ce
// qu'une liste de lignes ne montre pas.
function DishCard({ dish, name, category, onToggle, onDelete, deleting }: ItemProps) {
  const t = useTranslations("Dashboard.dishes");

  return (
    <div className="surface-panel flex h-full flex-col overflow-hidden">
      <Link
        href={`/dashboard/dishes/${dish.id}`}
        className="group relative block aspect-[4/3] w-full overflow-hidden"
      >
        <Thumbnail
          imageUrl={dish.imageUrl}
          name={name}
          className="h-full w-full rounded-none border-0"
          zoomOnHover
        />
        {dish.isArReady && (
          <span className="photo-chip absolute right-2.5 top-2.5">
            <ArCubeIcon className="h-3.5 w-3.5" />
            {t("arReady")}
          </span>
        )}
        {!dish.isAvailable && (
          <span className="photo-chip absolute left-2.5 top-2.5">{t("unavailable")}</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link
          href={`/dashboard/dishes/${dish.id}`}
          className="flex min-w-0 flex-col gap-0.5 transition-opacity hover:opacity-75"
        >
          <span className="truncate font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {[category, `${dish.price.toFixed(2)} $`].filter(Boolean).join(" · ")}
          </span>
        </Link>

        <div className="mt-auto flex items-center gap-2">
          <AvailabilityToggle
            checked={dish.isAvailable}
            onLabel={t("available")}
            offLabel={t("unavailable")}
            onChange={onToggle}
          />
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href={`/dashboard/dishes/${dish.id}/edit`}>{t("edit")}</Link>
          </Button>
          <DeleteButton label={t("delete")} onClick={onDelete} disabled={deleting} />
        </div>
      </div>
    </div>
  );
}

function Thumbnail({
  imageUrl,
  name,
  className,
  zoomOnHover = false,
}: {
  imageUrl: string | null;
  name: string;
  className: string;
  zoomOnHover?: boolean;
}) {
  const shared = `shrink-0 overflow-hidden rounded-xl border border-border/60 ${className}`;
  if (!imageUrl) {
    return (
      <div className={`${shared} flex items-center justify-center bg-foreground/[0.05]`}>
        <span className="font-heading text-base text-foreground/25">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <div className={shared}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={`h-full w-full object-cover ${
          zoomOnHover ? "transition-transform duration-500 group-hover:scale-105" : ""
        }`}
      />
    </div>
  );
}

function ArBadge({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 items-center rounded-full border border-border/70 p-1 text-muted-foreground"
    >
      <ArCubeIcon className="h-3.5 w-3.5" />
    </span>
  );
}

// Une case à cocher nue ne dit pas ce qu'elle commande tant qu'on n'a pas
// lu son étiquette, et son étiquette changeait de texte selon son état, ce
// qui rendait la colonne illisible d'un coup d'oeil. L'interrupteur montre
// son état par sa position. Il reste neutre plutôt que vert : le menu
// public n'admet que du neutre et du rouge, et l'état est déjà porté par
// la position du curseur et par le libellé accessible.
function AvailabilityToggle({
  checked,
  onLabel,
  offLabel,
  onChange,
}: {
  checked: boolean;
  onLabel: string;
  offLabel: string;
  onChange: () => void;
}) {
  const label = checked ? onLabel : offLabel;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-foreground" : "bg-foreground/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
          checked ? "left-[18px] bg-background" : "left-0.5 bg-foreground/40"
        }`}
      />
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
      className={`inline-flex items-center rounded-full px-2.5 py-1.5 transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
