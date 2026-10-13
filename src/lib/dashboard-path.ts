// Adresse de l'administration d'un restaurant : `/<slug>/dashboard/...`.
//
// L'administration porte le nom du restaurant dans son adresse, pour que le
// restaurateur reconnaisse la sienne et puisse la mettre en favori. Ce nom
// sert **à l'affichage seulement, jamais à l'autorisation** : chaque page
// du dashboard charge ses données à partir du compte connecté
// (`getCurrentRestaurantUser`), jamais à partir du slug de l'URL. Taper le
// slug d'un autre restaurant renvoie simplement vers le sien (voir le layout
// du dashboard), sans rien révéler de l'autre.
//
// Ne jamais charger de données du dashboard à partir de `params.restaurantSlug`.
export function dashboardPath(slug: string, path = ""): string {
  return `/${slug}/dashboard${path}`;
}
