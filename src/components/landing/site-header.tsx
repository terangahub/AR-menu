"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Header sticky — transparent au repos, fond solide dès que le scroll
// dépasse le hero (spec reflect.app). Menu mobile plein écran.
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

  const links = [
    { href: "#features", label: t("features") },
    { href: "#how-it-works", label: t("howItWorks") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-150",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[890px] items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-medium tracking-tight">
          Vorae
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center justify-center gap-8 bg-background md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-2xl font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button onClick={() => setMobileOpen(false)}>{t("cta")}</Button>
        </div>
      ) : null}
    </header>
  );
}
