import { defineRouting } from "next-intl/routing";

// Français prédominant par défaut — conforme Loi 96 (section 14 du cahier
// des charges). L'anglais reste accessible mais jamais servi par défaut.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});
