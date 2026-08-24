// Résout le nom affiché d'un plat selon la locale - même règle que
// menu-client.tsx / dish-list.tsx : fallback FR si nameEn est vide.
export function localizedDishName(
  name: string,
  nameEn: string | null | undefined,
  locale: string
): string {
  return locale === "en" && nameEn ? nameEn : name;
}
