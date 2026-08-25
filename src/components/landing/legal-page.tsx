import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Mise en page partagée par /privacy et /terms : même en-tête minimal que
// la landing (juste le logo et un lien retour, pas la navigation complète
// de `SiteHeader`, dont les liens sont des ancres `#section` qui n'ont de
// sens que sur la page d'accueil), même thème sombre forcé, mêmes tokens
// de couleur.
//
// Contenu à valeur de gabarit, pas un document juridique final : le
// bandeau d'avertissement en tête de page le dit explicitement, cf.
// `Legal.disclaimer` dans les fichiers de traduction.
export function LegalPage({
  translationKey,
  sectionKeys,
}: {
  translationKey: "privacy" | "terms";
  sectionKeys: string[];
}) {
  const t = useTranslations("Legal");
  const tPage = useTranslations(`Legal.${translationKey}`);
  const locale = useLocale();
  // Locale explicite : `undefined` retombe sur la locale du serveur
  // Node (souvent en-US) plutôt que celle de la page, ce qui affichait
  // "August" sur la version française.
  const updatedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div data-theme="dark" className="grain relative min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="border-b border-white/10 px-5 py-5">
        <div className="mx-auto flex max-w-[820px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-lg font-medium tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-secondary/40 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="" className="h-5 w-5" />
            </span>
            Vorae
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("backHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 py-16 sm:py-24">
        <div className="mb-8 rounded-card border border-primary/25 bg-primary/10 px-5 py-4 text-sm text-foreground/80">
          {t("disclaimer")}
        </div>

        <h1 className="text-gradient font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
          {tPage("title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("updated", { date: updatedDate })}
        </p>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{tPage("intro")}</p>

        <div className="mt-12 flex flex-col gap-10">
          {sectionKeys.map((key, i) => (
            <section key={key}>
              <h2 className="font-heading text-xl font-medium tracking-tight">
                {i + 1}. {tPage(`${key}Title`)}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/80">{tPage(`${key}Body`)}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
