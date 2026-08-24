import { defineRouting } from "next-intl/routing";

// Français prédominant par défaut - conforme Loi 96 (section 14, 17.3 du
// cahier des charges). localeDetection désactivé : sans ça, next-intl sert
// automatiquement l'anglais aux navigateurs configurés en anglais, ce que
// la loi interdit explicitement. "/" doit toujours résoudre vers "/fr".
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localeDetection: false,
});
