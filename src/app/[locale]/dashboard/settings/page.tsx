import { getTranslations } from "next-intl/server";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl } from "@/lib/qrcode";
import { routing } from "@/i18n/routing";
import { RestaurantSettings } from "@/components/dashboard/restaurant-settings";
import { Link } from "@/i18n/navigation";

// Paramètres du restaurant (section 10.5). Le nom, la ville, le logo et
// l'adresse du menu ne se modifiaient jusqu'ici qu'en base de données :
// un restaurateur qui changeait d'enseigne, corrigeait une faute dans son
// nom ou refaisait son logo n'avait aucun recours dans le produit.
export default async function SettingsPage() {
  const t = await getTranslations("Dashboard.settings");
  const restaurantUser = await getCurrentRestaurantUser();

  // Le layout du dashboard a déjà écarté le cas sans restaurant ; ce
  // garde-fou n'existe que pour le typage.
  if (!restaurantUser) return null;

  const { name, slug, city, email, logoUrl, defaultLocale } = restaurantUser.restaurant;

  // Origine seule, sans barre finale : elle sert de préfixe visuel devant
  // le champ d'adresse, pour que le restaurateur voie l'URL complète de
  // son menu au lieu d'un identifiant hors contexte.
  const menuBaseUrl = new URL(absoluteMenuUrl("/")).origin;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${slug}`}
          className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          {t("viewMenu")}
        </Link>
      </div>

      <RestaurantSettings
        initialValues={{ name, slug, city, email, defaultLocale, logoUrl }}
        menuBaseUrl={menuBaseUrl}
        locales={routing.locales}
      />
    </div>
  );
}
