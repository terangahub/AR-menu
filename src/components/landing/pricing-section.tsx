"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { TIERS, type BillingCycle } from "@/lib/billing";

// Section tarifs (cahier section 12.1 #9, 15.1) - mêmes montants que
// lib/billing.ts (source unique, réutilisée aussi par le dashboard
// facturation) pour ne jamais désynchroniser landing/dashboard/Stripe.
const TIER_COPY_KEYS = {
  essentiel: {
    name: "essentielName",
    dishes: "essentielDishes",
    features: ["essentielFeature1", "essentielFeature2", "essentielFeature3"],
  },
  croissance: {
    name: "croissanceName",
    dishes: "croissanceDishes",
    features: ["croissanceFeature1", "croissanceFeature2", "croissanceFeature3"],
    badge: "croissanceBadge",
  },
  prestige: {
    name: "prestigeName",
    dishes: "prestigeDishes",
    features: ["prestigeFeature1", "prestigeFeature2", "prestigeFeature3"],
  },
} as const;

// Bascule mensuel/annuel - un seul conteneur bordé englobant les deux
// options avec un indicateur qui glisse, plutôt que deux boutons isolés :
// l'utilisateur doit voir d'un coup d'œil que c'est un interrupteur à deux
// positions, pas deux actions indépendantes.
function CycleToggle({
  cycle,
  onChange,
  labels,
}: {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  labels: { monthly: string; annual: string; annualBadge: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* `inline-grid grid-cols-2` (et non flex) : les deux colonnes font
          exactement la même largeur, condition pour que l'indicateur
          coulissant à 50% se cale pile sur l'option active. En flex, les
          libellés de longueurs différentes donnaient des boutons inégaux
          et la pastille débordait sur l'option voisine. */}
      <div className="relative inline-grid grid-cols-2 rounded-full p-1 border-gradient bg-white/[0.04] shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]">
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-[0_0_24px_-4px_hsl(var(--primary)/0.9)] transition-transform duration-300 ease-out ${
            cycle === "annual" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {(
          [
            { id: "monthly" as const, label: labels.monthly },
            { id: "annual" as const, label: labels.annual },
          ]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={cycle === option.id}
            onClick={() => onChange(option.id)}
            className={`relative z-10 whitespace-nowrap rounded-full px-8 py-2.5 text-sm font-medium transition-colors duration-200 ${
              cycle === option.id
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Argument annuel sorti du bouton : gardé à l'intérieur, il rendait
          les deux colonnes trop larges pour un écran de téléphone. */}
      <span
        className={`text-xs font-medium transition-colors duration-300 ${
          cycle === "annual" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        ✦ {labels.annualBadge}
      </span>
    </div>
  );
}

export function PricingSection() {
  const t = useTranslations("Landing.pricing");
  const locale = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const currencyFormatter = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
  });

  return (
    <section id="pricing" className="relative isolate px-5 py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.28),transparent)] blur-2xl"
      />
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("eyebrow")}
            </span>
            <h2 className="text-gradient mx-auto mt-6 max-w-2xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
              {t("title")}
            </h2>
          </div>
          <div className="mt-10 flex justify-center">
            <CycleToggle
              cycle={cycle}
              onChange={setCycle}
              labels={{
                monthly: t("cycleMonthly"),
                annual: t("cycleAnnual"),
                annualBadge: t("cycleAnnualBadge"),
              }}
            />
          </div>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 sm:grid-cols-3">
          {TIERS.map((tier, i) => {
            const copy = TIER_COPY_KEYS[tier.id];
            const price = cycle === "annual" ? tier.annualPriceCad : tier.monthlyPriceCad;
            const highlighted = tier.id === "croissance";
            return (
              <Reveal key={tier.id} delayMs={i * 80} className="h-full">
                <div
                  className={`surface-card flex h-full flex-col gap-7 p-7 ${
                    highlighted
                      ? "border-gradient-animated !from-secondary/25 !to-white/[0.02] shadow-[0_0_60px_-20px_hsl(var(--secondary)/0.9)] sm:-my-3 sm:py-10"
                      : ""
                  }`}
                >
                  {"badge" in copy && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[0_0_24px_-6px_hsl(var(--primary))]">
                      {t(copy.badge)}
                    </span>
                  )}
                  <div>
                    <h3 className="font-heading text-base font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {t(copy.name)}
                    </h3>
                    <p className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-5xl font-medium tracking-tight">
                        {currencyFormatter.format(price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{cycle === "annual" ? t("perYear") : t("perMonth")}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-primary/90">{t(copy.dishes)}</p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  <ul className="flex flex-1 flex-col gap-3 text-sm">
                    {copy.features.map((key) => (
                      <li key={key} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        <span className="text-foreground/90">{t(key)}</span>
                      </li>
                    ))}
                    {tier.extraDishPriceCad != null && (
                      <li className="mt-1 text-xs text-muted-foreground">
                        {t("extraDish", { price: tier.extraDishPriceCad })}
                      </li>
                    )}
                  </ul>

                  <Button asChild variant={highlighted ? "default" : "outline"} className="w-full">
                    <Link href="/dashboard">{t("cta")}</Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
