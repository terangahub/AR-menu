"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { TIERS, type BillingCycle } from "@/lib/billing";

// Section tarifs (cahier section 12.1 #9, 15.1) — mêmes montants que
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
    <section id="pricing" className="px-4 py-24">
      <div className="mx-auto max-w-[890px]">
        <Reveal>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("eyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                cycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("cycleMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setCycle("annual")}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                cycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("cycleAnnual")} · {t("cycleAnnualBadge")}
            </button>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TIERS.map((tier, i) => {
            const copy = TIER_COPY_KEYS[tier.id];
            const price = cycle === "annual" ? tier.annualPriceCad : tier.monthlyPriceCad;
            const highlighted = tier.id === "croissance";
            return (
              <Reveal key={tier.id} delayMs={i * 80}>
                <div
                  className={`relative flex h-full flex-col gap-6 rounded-card border p-6 ${
                    highlighted
                      ? "border-primary/60 bg-gradient-to-b from-secondary/30 to-card"
                      : "border-border bg-card"
                  }`}
                >
                  {"badge" in copy && (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      {t(copy.badge)}
                    </span>
                  )}
                  <div>
                    <h3 className="font-heading text-lg font-medium">{t(copy.name)}</h3>
                    <p className="mt-3 text-3xl font-semibold">
                      {currencyFormatter.format(price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{cycle === "annual" ? t("perYear") : t("perMonth")}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(copy.dishes)}</p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-2 text-sm">
                    {copy.features.map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{t(key)}</span>
                      </li>
                    ))}
                    {tier.extraDishPriceCad != null && (
                      <li className="text-xs text-muted-foreground">
                        {t("extraDish", { price: tier.extraDishPriceCad })}
                      </li>
                    )}
                  </ul>
                  <Button asChild variant={highlighted ? "default" : "outline"}>
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
