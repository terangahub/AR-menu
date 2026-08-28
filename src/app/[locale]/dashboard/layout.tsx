import { UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ExternalIcon } from "@/components/dashboard/nav-icons";

// Dashboard restaurateur (section 10) - protégé par le middleware Clerk
// (src/middleware.ts) sur /:locale/dashboard(.*).
//
// force-dynamic (hérité par toutes les routes filles) : contenu propre à
// chaque utilisateur connecté - sans ça, Next pré-génère ces pages une
// seule fois au build (sans session réelle) et sert la même page figée à
// tout le monde en production.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Dashboard");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p className="text-muted-foreground">{t("noRestaurant")}</p>
      </main>
    );
  }

  const { name, city, slug, logoUrl } = restaurantUser.restaurant;

  const labels = {
    overview: t("nav.overview"),
    dishes: t("nav.dishes"),
    qrcodes: t("nav.qrcodes"),
    analytics: t("nav.analytics"),
    billing: t("nav.billing"),
    settings: t("nav.settings"),
  };

  // La navigation vivait dans une barre horizontale unique, où six
  // rubriques et le nom du restaurant se disputaient la largeur. Sur un
  // grand écran elle passe en colonne fixe : les rubriques y respirent, et
  // le contenu récupère toute la largeur utile. La barre horizontale est
  // conservée sous 1024 px, où une colonne mangerait la moitié de l'écran.
  const identity = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-heading text-base text-foreground/40">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium leading-tight">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{city}</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-[248px] shrink-0 flex-col justify-between border-r border-border/70 p-4 lg:flex print:hidden">
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="px-2 font-heading text-lg tracking-tight">
            Vorae
          </Link>
          <div className="px-1">{identity}</div>
          <DashboardNav labels={labels} orientation="sidebar" />
        </div>

        <div className="flex flex-col gap-3">
          {/* Le lien vers le menu public est mis à part et signalé comme
              sortant : ce n'est pas une rubrique du dashboard, c'est la
              vue du convive, sur un autre site. */}
          <a
            href={`/fr/${slug}`}
            target="_blank"
            rel="noopener"
            className="nav-item text-muted-foreground"
          >
            <ExternalIcon className="h-[18px] w-[18px] shrink-0" />
            {t("nav.publicMenu")}
          </a>
          <div className="flex items-center justify-between gap-2 border-t border-border/70 px-2 pt-3">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="border-b border-border/70 px-4 py-3 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3 pb-3">
          {identity}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
        <DashboardNav labels={labels} orientation="bar" />
      </header>

      <main className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
