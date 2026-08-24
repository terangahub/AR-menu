import { UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

// Dashboard restaurateur (section 10) — protégé par le middleware Clerk
// (src/middleware.ts) sur /:locale/dashboard(.*). Sprint 2 : gestion des
// plats et QR codes. Vue d'ensemble/analytics : Sprint 3 (section 10.1, 10.3).
//
// force-dynamic (hérité par toutes les routes filles) : contenu propre à
// chaque utilisateur connecté — sans ça, Next pré-génère ces pages une
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3 print:hidden">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Vorae
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              {t("nav.overview")}
            </Link>
            <Link href="/dashboard/dishes" className="hover:underline">
              {t("nav.dishes")}
            </Link>
            <Link href="/dashboard/qrcodes" className="hover:underline">
              {t("nav.qrcodes")}
            </Link>
            <Link href="/dashboard/analytics" className="hover:underline">
              {t("nav.analytics")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {restaurantUser.restaurant.name}
          </span>
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
    </div>
  );
}
