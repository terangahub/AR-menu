"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export type RestaurantSettingsValues = {
  name: string;
  slug: string;
  city: string;
  email: string;
  defaultLocale: string;
  logoUrl: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Transforme une saisie libre en identifiant d'adresse : le restaurateur
// tape "Chez Léa - Plateau", pas "chez-lea-plateau". La normalisation se
// fait à la frappe plutôt qu'à l'envoi, pour qu'il voie tout de suite
// l'adresse réelle de son menu et n'ait pas à deviner la règle.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RestaurantSettings({
  initialValues,
  menuBaseUrl,
  locales,
}: {
  initialValues: RestaurantSettingsValues;
  menuBaseUrl: string;
  locales: readonly string[];
}) {
  const t = useTranslations("Dashboard.settings");
  const router = useRouter();

  // Table explicite plutôt qu'une clé construite à la volée : next-intl
  // vérifie les clés à la compilation, une clé calculée passerait au
  // travers et n'échouerait qu'au rendu, chez le client.
  const localeLabels: Record<string, string> = {
    fr: t("localeFr"),
    en: t("localeEn"),
  };

  const [values, setValues] = useState(initialValues);
  const [savedSlug, setSavedSlug] = useState(initialValues.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  function set<K extends keyof RestaurantSettingsValues>(
    key: K,
    value: RestaurantSettingsValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const slugIsValid = SLUG_PATTERN.test(values.slug);
  const slugChanged = values.slug !== savedSlug;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/restaurant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        slug: values.slug,
        city: values.city,
        email: values.email,
        defaultLocale: values.defaultLocale,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      // Le conflit d'adresse est le seul cas que le restaurateur peut
      // corriger lui-même : il mérite son propre message, pas le générique.
      setError(body?.error === "slug_taken" ? t("slugTaken") : t("error"));
      setSaving(false);
      return;
    }

    setSavedSlug(values.slug);
    setSaving(false);
    setSaved(true);
    // Le nom du restaurant s'affiche dans l'en-tête du dashboard, rendu
    // côté serveur : sans rafraîchissement, il resterait l'ancien.
    router.refresh();
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoBusy(true);
    setLogoError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/restaurant/logo", { method: "POST", body: formData });

    if (!res.ok) {
      setLogoError(t("logoError"));
      setLogoBusy(false);
      if (logoInput.current) logoInput.current.value = "";
      return;
    }

    const body = (await res.json()) as { logoUrl: string };
    setLogoUrl(body.logoUrl);
    setLogoBusy(false);
    if (logoInput.current) logoInput.current.value = "";
    router.refresh();
  }

  async function handleLogoRemove() {
    setLogoBusy(true);
    setLogoError(null);
    const res = await fetch("/api/restaurant/logo", { method: "DELETE" });
    if (!res.ok) {
      setLogoError(t("logoError"));
      setLogoBusy(false);
      return;
    }
    setLogoUrl(null);
    setLogoBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="surface-panel flex flex-col gap-4 p-5">
        <SectionTitle title={t("identity")} hint={t("identityHint")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("name")} required>
            <input
              required
              maxLength={80}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("city")} required>
            <input
              required
              maxLength={80}
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("email")} required hint={t("emailHint")}>
            <input
              required
              type="email"
              maxLength={160}
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("defaultLocale")} hint={t("defaultLocaleHint")}>
            <select
              value={values.defaultLocale}
              onChange={(e) => set("defaultLocale", e.target.value)}
              className="input"
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeLabels[locale] ?? locale.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="surface-panel flex flex-col gap-4 p-5">
        <SectionTitle title={t("logo")} hint={t("logoHint")} />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-heading text-2xl text-foreground/25">
                {values.name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={logoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              disabled={logoBusy}
              className="hidden"
              id="logo-input"
            />
            <Button
              type="button"
              variant="outline"
              disabled={logoBusy}
              onClick={() => logoInput.current?.click()}
            >
              {logoBusy ? t("logoUploading") : logoUrl ? t("logoReplace") : t("logoUpload")}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                disabled={logoBusy}
                onClick={handleLogoRemove}
              >
                {t("logoRemove")}
              </Button>
            )}
          </div>
        </div>

        {/* Le logo part sur Cloudinary dès la sélection du fichier, pas à
            l'envoi du formulaire : c'est une action séparée, il faut le
            dire, sinon un restaurateur qui remplace son logo puis annule
            croira l'avoir annulé aussi. */}
        <p className="text-xs text-muted-foreground">{t("logoImmediate")}</p>
        {logoError && <p className="text-sm text-destructive">{logoError}</p>}
      </section>

      <section className="surface-panel flex flex-col gap-4 p-5">
        <SectionTitle title={t("address")} hint={t("addressHint")} />

        <Field label={t("slug")} required>
          <div className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-within:ring-1 focus-within:ring-ring">
            <span className="shrink-0 text-muted-foreground">{menuBaseUrl}/</span>
            <input
              required
              value={values.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
        </Field>

        {!slugIsValid && values.slug.length > 0 && (
          <p className="text-sm text-destructive">{t("slugInvalid")}</p>
        )}

        {/* Avertissement affiché seulement quand le changement est réel :
            un bandeau permanent finirait par ne plus être lu, alors que
            c'est la seule action de cet écran qui casse quelque chose de
            physique, déjà collé sur les tables. */}
        {slugChanged && (
          <div className="rounded-card border border-destructive/25 bg-destructive/[0.06] p-4 text-sm">
            <p className="font-medium text-destructive">{t("slugWarningTitle")}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {t("slugWarningBody")}
            </p>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-success">{t("saved")}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving || !slugIsValid}>
          {saving ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValues({ ...initialValues, slug: savedSlug });
            setError(null);
            setSaved(false);
          }}
        >
          {t("reset")}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-heading text-lg">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
