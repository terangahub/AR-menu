// Slugs qu'un restaurant ne peut pas prendre.
//
// Depuis que l'administration vit sous `/<slug>/dashboard`, le slug d'un
// restaurant occupe le même niveau d'adresse que les pages fixes du site.
// Next.js fait passer un segment fixe avant un segment dynamique : un
// restaurant nommé `privacy` verrait son menu remplacé par la politique de
// confidentialité, et un restaurant nommé `dashboard` rendrait son menu
// inaccessible. Ces noms sont donc refusés à la saisie.
//
// À compléter à chaque nouvelle page fixe sous `src/app/[locale]/`.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Pages fixes existantes.
  "dashboard",
  "privacy",
  "terms",
  // Administration de la plateforme, prévue au Sprint 8 (section 11).
  "superadmin",
  "admin",
  // Préfixes techniques et de langue.
  "api",
  "fr",
  "en",
  // Parcours de connexion et d'inscription.
  "sign-in",
  "sign-up",
  "login",
  "signup",
  "onboarding",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
