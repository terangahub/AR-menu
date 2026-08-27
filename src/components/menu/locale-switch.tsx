"use client";

import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { fr: "FR", en: "EN" };

// Bascule de langue du menu public (Sprint 6). Le menu est bilingue depuis
// le Sprint 1 (F06), mais aucun moyen de changer de langue n'existait :
// un convive anglophone qui scanne le QR arrivait en français sans issue,
// puisque `localeDetection` est volontairement désactivé pour respecter la
// Loi 96 (voir i18n/routing.ts).
//
// `usePathname` de next-intl renvoie le chemin sans le préfixe de langue,
// et `router.replace` le réapplique : la bascule conserve donc le plat
// consulté au lieu de renvoyer à la racine du menu.
export function LocaleSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const current = typeof params?.locale === "string" ? params.locale : routing.defaultLocale;

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border/70 bg-card/60 p-0.5 backdrop-blur ${className}`}
    >
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-current={active ? "true" : undefined}
            // `replace` et non `push` : la langue n'est pas une étape de
            // navigation, la revenir en arrière n'aurait aucun sens.
            onClick={() => router.replace(pathname, { locale })}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {LABELS[locale] ?? locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
