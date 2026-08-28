"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Allergen = { code: string; nameFr: string; nameEn: string };
type CategoryOption = { category: string; categoryEn: string | null };

const NEW_CATEGORY = "__new__";

export type DishFormValues = {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  categoryEn: string;
  ingredients: string;
  ingredientsEn: string;
  price: string;
  prepTimeMinutes: string;
  isAvailable: boolean;
  allergenCodes: string[];
};

const EMPTY_VALUES: DishFormValues = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  category: "",
  categoryEn: "",
  ingredients: "",
  ingredientsEn: "",
  price: "",
  prepTimeMinutes: "",
  isAvailable: true,
  allergenCodes: [],
};

export function DishForm({
  mode,
  dishId,
  initialValues,
  allergens,
  existingCategories,
}: {
  mode: "create" | "edit";
  dishId?: string;
  initialValues?: Partial<DishFormValues>;
  allergens: Allergen[];
  existingCategories: CategoryOption[];
}) {
  const t = useTranslations("Dashboard.dishForm");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<DishFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialCategory = initialValues?.category ?? "";
  const matchesExisting = existingCategories.some((c) => c.category === initialCategory);
  const [categoryChoice, setCategoryChoice] = useState<string>(
    initialCategory === "" ? "" : matchesExisting ? initialCategory : NEW_CATEGORY
  );

  function handleCategoryChoice(choice: string) {
    setCategoryChoice(choice);
    if (choice === NEW_CATEGORY) return;
    if (choice === "") {
      set("category", "");
      set("categoryEn", "");
      return;
    }
    const match = existingCategories.find((c) => c.category === choice);
    set("category", choice);
    set("categoryEn", match?.categoryEn ?? "");
  }

  function set<K extends keyof DishFormValues>(key: K, value: DishFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAllergen(code: string) {
    setValues((prev) => ({
      ...prev,
      allergenCodes: prev.allergenCodes.includes(code)
        ? prev.allergenCodes.filter((c) => c !== code)
        : [...prev.allergenCodes, code],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: values.name,
      nameEn: values.nameEn || null,
      description: values.description || null,
      descriptionEn: values.descriptionEn || null,
      category: values.category || null,
      categoryEn: values.categoryEn || null,
      ingredients: values.ingredients || null,
      ingredientsEn: values.ingredientsEn || null,
      price: values.price,
      prepTimeMinutes: values.prepTimeMinutes || null,
      isAvailable: values.isAvailable,
      allergenCodes: values.allergenCodes,
    };

    const res = await fetch(
      mode === "create" ? "/api/dishes" : `/api/dishes/${dishId}`,
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      setError(t("error"));
      setSaving(false);
      return;
    }

    if (mode === "create") {
      // Redirige vers l'édition pour permettre d'ajouter tout de suite la
      // photo et le modèle 3D - pas de champ fichier avant que le plat
      // n'existe (il faut son id pour les uploads).
      const created = (await res.json()) as { id: string };
      router.push(`/dashboard/dishes/${created.id}/edit`);
    } else {
      router.push("/dashboard/dishes");
    }
    router.refresh();
  }

  return (
    // Le formulaire était une pile ininterrompue de dix-huit champs, tous
    // de même poids : rien n'y distinguait le nom et le prix, sans lesquels
    // un plat n'existe pas, des ingrédients en anglais, qu'on remplit un
    // mois plus tard. Trois sections, dans l'ordre où un restaurateur les
    // renseigne réellement.
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormSection title={t("sectionEssentials")} hint={t("sectionEssentialsHint")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("nameFr")} required>
            <input
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("nameEn")}>
            <input
              value={values.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              className="input"
            />
          </Field>

          <Field label={t("price")} required>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("prepTimeMinutes")}>
            <input
              type="number"
              min="0"
              value={values.prepTimeMinutes}
              onChange={(e) => set("prepTimeMinutes", e.target.value)}
              className="input"
            />
          </Field>

          <Field label={t("categoryFr")}>
            <select
              value={categoryChoice}
              onChange={(e) => handleCategoryChoice(e.target.value)}
              className="input"
            >
              <option value="">{t("noCategory")}</option>
              {existingCategories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
              <option value={NEW_CATEGORY}>{t("newCategory")}</option>
            </select>
          </Field>
          {categoryChoice === NEW_CATEGORY && (
            <>
              <Field label={t("categoryFr")}>
                <input
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label={t("categoryEn")}>
                <input
                  value={values.categoryEn}
                  onChange={(e) => set("categoryEn", e.target.value)}
                  className="input"
                />
              </Field>
            </>
          )}
        </div>

        {/* La disponibilité décide si le plat apparaît sur le menu public :
            c'est une conséquence visible en salle, pas une case parmi les
            autres. Elle sort de la grille et s'explique. */}
        <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-current"
            checked={values.isAvailable}
            onChange={(e) => set("isAvailable", e.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{t("available")}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {t("availableHint")}
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection title={t("sectionDetails")} hint={t("sectionDetailsHint")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("descriptionFr")}>
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="input"
              rows={3}
            />
          </Field>
          <Field label={t("descriptionEn")}>
            <textarea
              value={values.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              className="input"
              rows={3}
            />
          </Field>

          <Field label={t("ingredientsFr")}>
            <input
              value={values.ingredients}
              onChange={(e) => set("ingredients", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("ingredientsEn")}>
            <input
              value={values.ingredientsEn}
              onChange={(e) => set("ingredientsEn", e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </FormSection>

      {allergens.length > 0 && (
        <FormSection title={t("allergens")} hint={t("allergensHint")}>
          {/* Pastilles à bascule plutôt qu'une rangée de cases : une case
              cochée dans une grille de quatorze se repère mal, alors qu'une
              pastille sélectionnée se voit de loin. Le rouge est réservé
              aux allergènes dans tout le produit, il sert ici aussi.

              Les libellés suivaient toujours le français : un restaurateur
              qui travaille en anglais lisait "Arachides" au milieu d'une
              interface anglaise. */}
          <div className="flex flex-wrap gap-2">
            {allergens.map((a) => {
              const selected = values.allergenCodes.includes(a.code);
              return (
                <button
                  key={a.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAllergen(a.code)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-destructive/45 bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {locale === "en" ? a.nameEn : a.nameFr}
                </button>
              );
            })}
          </div>
        </FormSection>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/dishes")}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base leading-tight">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}
