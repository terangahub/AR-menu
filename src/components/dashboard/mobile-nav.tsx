"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/locale-switch";
import { CloseIcon } from "@/components/menu/menu-icons";
import {
  AnalyticsIcon,
  BillingIcon,
  DishesIcon,
  ExternalIcon,
  OverviewIcon,
  QrIcon,
  SettingsIcon,
} from "./nav-icons";

type NavKey = "overview" | "dishes" | "qrcodes" | "analytics" | "billing" | "settings";

// Les rubriques principales, et `settings` à part : c'est un réglage, pas
// une rubrique de travail. Le gabarit de référence le place lui aussi en
// bas, séparé par un filet, et cette séparation dit quelque chose de vrai
// sur la nature de l'entrée.
const MAIN: { key: NavKey; href: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { key: "overview", href: "/dashboard", Icon: OverviewIcon },
  { key: "dishes", href: "/dashboard/dishes", Icon: DishesIcon },
  { key: "qrcodes", href: "/dashboard/qrcodes", Icon: QrIcon },
  { key: "analytics", href: "/dashboard/analytics", Icon: AnalyticsIcon },
  { key: "billing", href: "/dashboard/billing", Icon: BillingIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Navigation du dashboard sur téléphone.
//
// Elle était une barre de pastilles qui défilait horizontalement : les deux
// dernières rubriques vivaient hors de l'écran, et rien n'indiquait
// qu'elles existaient. Un tiroir montre les six d'un coup.
//
// Il s'ouvre par la droite et ne couvre pas toute la largeur : le pouce
// tient l'appareil de ce côté, et laisser voir la page dessous rappelle
// qu'on la recouvre au lieu d'avoir changé d'écran.
export function DashboardMobileNav({
  labels,
  publicMenuLabel,
  publicMenuHref,
  menuLabel,
  closeLabel,
  restaurant,
}: {
  labels: Record<NavKey, string>;
  publicMenuLabel: string;
  publicMenuHref: string;
  menuLabel: string;
  closeLabel: string;
  restaurant: { name: string; city: string; logoUrl: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fermeture au changement de page : sans ça, le tiroir resterait ouvert
  // par-dessus l'écran qu'on vient de demander.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    // La page ne doit pas défiler derrière le tiroir : sur iOS, un
    // glissement destiné au tiroir emporte sinon la page entière.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Le voile ferme le tiroir, et il est assez sombre pour que la
              page dessous cesse de disputer l'attention sans disparaître. */}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="drawer-scrim absolute inset-0 h-full w-full cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
            className="drawer-panel absolute inset-y-0 right-0 flex w-[80%] max-w-[300px] flex-col border-l border-border/70 bg-background"
          >
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70">
                  {restaurant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={restaurant.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-heading text-base text-foreground/40">
                      {restaurant.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-tight">
                    {restaurant.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {restaurant.city}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-2">
              {MAIN.map(({ key, href, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={key}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-item py-2.5 ${active ? "nav-item-active" : ""}`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {labels[key]}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-1 border-t border-border/70 px-3 py-3">
              <Link
                href="/dashboard/settings"
                aria-current={isActive(pathname, "/dashboard/settings") ? "page" : undefined}
                className={`nav-item py-2.5 ${
                  isActive(pathname, "/dashboard/settings") ? "nav-item-active" : ""
                }`}
              >
                <SettingsIcon className="h-[18px] w-[18px] shrink-0" />
                {labels.settings}
              </Link>

              <a
                href={publicMenuHref}
                target="_blank"
                rel="noopener"
                className="nav-item py-2.5"
                onClick={() => setOpen(false)}
              >
                <ExternalIcon className="h-[18px] w-[18px] shrink-0" />
                {publicMenuLabel}
              </a>

              <div className="mt-1 flex items-center justify-between gap-2 px-2.5 pt-2">
                <UserButton />
                <div className="flex items-center gap-2">
                  <LocaleSwitch />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
