"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "./use-dashboard-path";
import {
  AnalyticsIcon,
  BillingIcon,
  DishesIcon,
  OverviewIcon,
  QrIcon,
  SettingsIcon,
} from "./nav-icons";

type NavKey = "overview" | "dishes" | "qrcodes" | "analytics" | "billing" | "settings";

const ITEMS: { key: NavKey; path: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { key: "overview", path: "", Icon: OverviewIcon },
  { key: "dishes", path: "/dishes", Icon: DishesIcon },
  { key: "qrcodes", path: "/qrcodes", Icon: QrIcon },
  { key: "analytics", path: "/analytics", Icon: AnalyticsIcon },
  { key: "billing", path: "/billing", Icon: BillingIcon },
  { key: "settings", path: "/settings", Icon: SettingsIcon },
];

// `usePathname` de next-intl renvoie le chemin sans préfixe de langue, donc
// la comparaison marche identiquement en /fr et en /en.
//
// Les chemins sont relatifs au dashboard du restaurant (`/<slug>/dashboard`).
// La vue d'ensemble en est la racine : une comparaison par préfixe
// l'allumerait sur toutes les pages du dashboard. Elle exige donc une
// égalité stricte, les autres se contentent du préfixe pour rester
// allumées sur leurs sous-pages (`.../dishes/123/edit`).
function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Colonne de gauche, au-delà de 1024 px uniquement. Sur téléphone la
// navigation vit dans un tiroir (`DashboardMobileNav`) : la variante
// horizontale qui existait ici défilait latéralement, ce qui laissait deux
// rubriques hors de l'écran sans rien pour les signaler.
export function DashboardNav({ labels }: { labels: Record<NavKey, string> }) {
  const pathname = usePathname();
  const dash = useDashboardPath();

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map(({ key, path, Icon }) => {
        const href = dash(path);
        const active = isActive(pathname, href, path === "");
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
