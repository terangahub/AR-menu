"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Allergen = { code: string; nameFr: string; nameEn: string };

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
}: {
  mode: "create" | "edit";
  dishId?: string;
  initialValues?: Partial<DishFormValues>;
  allergens: Allergen[];
}) {
  const t = useTranslations("Dashboard.dishForm");
  const router = useRouter();
  const [values, setValues] = useState<DishFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Error");
      setSaving(false);
      return;
    }

    if (mode === "create") {
      // Redirige vers l'édition pour permettre d'ajouter tout de suite la
      // photo et le modèle 3D — pas de champ fichier avant que le plat
      // n'existe (il faut son id pour les uploads).
      const created = (await res.json()) as { id: string };
      router.push(`/dashboard/dishes/${created.id}/edit`);
    } else {
      router.push("/dashboard/dishes");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

        <Field label={t("descriptionFr")}>
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            className="input"
            rows={2}
          />
        </Field>
        <Field label={t("descriptionEn")}>
          <textarea
            value={values.descriptionEn}
            onChange={(e) => set("descriptionEn", e.target.value)}
            className="input"
            rows={2}
          />
        </Field>

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
      </div>

      {allergens.length > 0 && (
        <div>
          <span className="text-sm font-medium">{t("allergens")}</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {allergens.map((a) => (
              <label key={a.code} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.allergenCodes.includes(a.code)}
                  onChange={() => toggleAllergen(a.code)}
                />
                {a.nameFr}
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isAvailable}
          onChange={(e) => set("isAvailable", e.target.checked)}
        />
        {t("available")}
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}
