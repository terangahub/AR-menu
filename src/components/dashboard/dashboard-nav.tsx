"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  AnalyticsIcon,
  BillingIcon,
  DishesIcon,
  OverviewIcon,
  QrIcon,
  SettingsIcon,
} from "./nav-icons";

type NavKey = "overview" | "dishes" | "qrcodes" | "analytics" | "billing" | "settings";

const ITEMS: { key: NavKey; href: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { key: "overview", href: "/dashboard", Icon: OverviewIcon },
  { key: "dishes", href: "/dashboard/dishes", Icon: DishesIcon },
  { key: "qrcodes", href: "/dashboard/qrcodes", Icon: QrIcon },
  { key: "analytics", href: "/dashboard/analytics", Icon: AnalyticsIcon },
  { key: "billing", href: "/dashboard/billing", Icon: BillingIcon },
  { key: "settings", href: "/dashboard/settings", Icon: SettingsIcon },
];

// `usePathname` de next-intl renvoie le chemin sans préfixe de langue, donc
// la comparaison marche identiquement en /fr et en /en.
//
// La vue d'ensemble vit à la racine `/dashboard` : une comparaison par
// préfixe l'allumerait sur toutes les pages du dashboard. Elle exige donc
// une égalité stricte, les autres se contentent du préfixe pour rester
// allumées sur leurs sous-pages (`/dashboard/dishes/123/edit`).
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Colonne de gauche, au-delà de 1024 px uniquement. Sur téléphone la
// navigation vit dans un tiroir (`DashboardMobileNav`) : la variante
// horizontale qui existait ici défilait latéralement, ce qui laissait deux
// rubriques hors de l'écran sans rien pour les signaler.
export function DashboardNav({ labels }: { labels: Record<NavKey, string> }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map(({ key, href, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`nav-item ${active ? "nav-item-active" : ""}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {labels[key]}
          </Link>
        );
      })}
    </nav>
  );
}
