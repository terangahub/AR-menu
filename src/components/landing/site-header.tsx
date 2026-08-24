"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Header sticky - transparent au repos, fond solide dès que le scroll
// dépasse le hero (spec reflect.app). Menu mobile plein écran.
//
// IMPORTANT : l'overlay mobile est un frère du <header>, jamais un enfant.
// `backdrop-blur` (comme `filter`/`transform`) fait de l'élément un
// containing block pour ses descendants `position: fixed` - un overlay
// `fixed inset-0` imbriqué se positionnait donc par rapport au header
// (64px de haut) au lieu du viewport, d'où le texte du menu superposé au
// logo. Ne pas le remettre à l'intérieur du header.
export function SiteHeader() {
  const t = useTranslations("Landing.nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Verrouille le scroll de la page tant que le menu plein écran est
  // ouvert - sinon le contenu défile derrière l'overlay (bug constaté).
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Ferme le menu si l'écran repasse en desktop pendant qu'il est ouvert
  // (rotation de l'appareil) - sinon le scroll reste verrouillé.
  useEffect(() => {
    if (!mobileOpen) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && setMobileOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mobileOpen]);

  const links = [
    { href: "#features", label: t("features") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#reviews", label: t("reviews") },
    { href: "#pricing", label: t("pricing") },
  ];

  const wordmark = (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-heading text-lg font-medium tracking-tight"
      onClick={() => setMobileOpen(false)}
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-secondary/40 ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-5 w-5" />
      </span>
      Vorae
    </Link>
  );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled && !mobileOpen
            ? "border-b border-white/10 bg-background/70 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-5">
          {wordmark}

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button size="sm">{t("cta")}</Button>
          </div>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="-mr-2 p-2 text-foreground md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
            {wordmark}
            <button
              type="button"
              aria-label="Fermer"
              className="-mr-2 p-2 text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b border-white/10 px-5 py-6 text-2xl font-medium tracking-tight transition-colors active:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="px-5 py-8">
            <Button className="w-full" size="lg" onClick={() => setMobileOpen(false)}>
              {t("cta")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
