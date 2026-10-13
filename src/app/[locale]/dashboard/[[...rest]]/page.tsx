import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { dashboardPath } from "@/lib/dashboard-path";

// Entrée générique de l'administration : `/fr/dashboard`, et tout ce qui se
// trouve dessous.
//
// L'administration vit désormais sous `/<slug>/dashboard`, mais cette
// adresse reste indispensable : c'est celle des boutons de la landing,
// celle où Clerk renvoie après la connexion, celle des retours de Stripe,
// et celle des favoris enregistrés avant le changement. Elle redirige vers
// l'administration du restaurant **du compte connecté**, en conservant la
// sous-page et les paramètres de requête (Stripe y passe
// `?checkout=success`, qu'il ne faut pas perdre en route).
//
// Protégée par le middleware comme le reste du dashboard.
export const dynamic = "force-dynamic";

export default async function DashboardEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, rest } = await params;
  const query = await searchParams;
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    const t = await getTranslations("Dashboard");
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p className="text-muted-foreground">{t("noRestaurant")}</p>
      </main>
    );
  }

  const subPath = rest && rest.length > 0 ? `/${rest.map(encodeURIComponent).join("/")}` : "";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else if (value != null) search.append(key, value);
  }
  const queryString = search.toString();

  redirect({
    href: `${dashboardPath(restaurantUser.restaurant.slug, subPath)}${queryString ? `?${queryString}` : ""}`,
    locale,
  });
}
