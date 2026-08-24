"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TIERS, type TierId, type BillingCycle } from "@/lib/billing";

type SubscriptionInfo = {
  tier: string;
  billingCycle: string;
  status: string;
  currentPeriodEnd: string | null;
} | null;

type InvoiceInfo = {
  id: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
  issuedAt: string;
};

const KNOWN_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;

// Les statuts Stripe hors de cette liste (unpaid, incomplete, ...) restent
// rares en usage normal - affichés tels quels plutôt que de bloquer sur
// une clé de traduction manquante.
function statusLabelFor(status: string, t: (key: string) => string): string {
  return (KNOWN_STATUSES as readonly string[]).includes(status)
    ? t(`status.${status}`)
    : status;
}

export function BillingPanel({
  locale,
  subscription,
  invoices,
}: {
  locale: "fr" | "en";
  subscription: SubscriptionInfo;
  invoices: InvoiceInfo[];
}) {
  const t = useTranslations("Dashboard.billing");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: TierId) {
    setError(null);
    setLoadingTier(tier);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, cycle, locale }),
    });
    if (!res.ok) {
      setLoadingTier(null);
      setError(t("error"));
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  async function openPortal() {
    setError(null);
    setLoadingPortal(true);
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    if (!res.ok) {
      setLoadingPortal(false);
      setError(t("error"));
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  const currencyFormatter = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
  });

  const statusLabel = subscription ? statusLabelFor(subscription.status, t) : "";

  if (subscription) {
    return (
      <div className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="rounded-lg border border-border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
              <p className="mt-1 text-xl font-semibold capitalize">{subscription.tier}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(subscription.billingCycle === "annual" ? "cycleAnnual" : "cycleMonthly")}
                {" · "}
                {statusLabel}
              </p>
              {subscription.currentPeriodEnd && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("renewsOn", {
                    date: new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      locale === "fr" ? "fr-CA" : "en-CA"
                    ),
                  })}
                </p>
              )}
            </div>
            <Button onClick={openPortal} disabled={loadingPortal}>
              {loadingPortal ? t("loading") : t("managePlan")}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t("invoices")}</h2>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">{t("noInvoices")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{new Date(inv.issuedAt).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA")}</span>
                  <span>{currencyFormatter.format(inv.amount)}</span>
                  <span className="text-muted-foreground">{inv.status}</span>
                  {inv.pdfUrl ? (
                    <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {t("downloadInvoice")}
                    </a>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setCycle("monthly")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {t("cycleMonthly")}
        </button>
        <button
          type="button"
          onClick={() => setCycle("annual")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {t("cycleAnnual")} · {t("cycleAnnualBadge")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const price = cycle === "annual" ? tier.annualPriceCad : tier.monthlyPriceCad;
          return (
            <div
              key={tier.id}
              className="flex flex-col gap-4 rounded-lg border border-border p-6"
            >
              <div>
                <h3 className="text-lg font-semibold capitalize">{tier.id}</h3>
                <p className="mt-1 text-2xl font-semibold">
                  {currencyFormatter.format(price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{cycle === "annual" ? t("perYear") : t("perMonth")}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.includedDishSlots === -1
                    ? t("unlimitedDishes")
                    : t("includedDishes", { count: tier.includedDishSlots })}
                </p>
              </div>
              <Button
                onClick={() => startCheckout(tier.id)}
                disabled={loadingTier !== null}
                variant={tier.id === "croissance" ? "default" : "outline"}
              >
                {loadingTier === tier.id ? t("loading") : t("subscribe")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
