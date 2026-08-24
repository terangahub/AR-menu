import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { SiteHeader } from "@/components/landing/site-header";
import { PricingSection } from "@/components/landing/pricing-section";
import { Sparkles, ShieldCheck, Languages } from "lucide-react";

// Landing marketing — direction reflect.app (voir CONTEXT.md pour la
// justification du remplacement de palette). Force le thème sombre
// localement : reflect.app n'a pas de mode clair, le dashboard garde sa
// préférence système par défaut (voir [locale]/layout.tsx). Les pages
// /privacy et /terms n'existent pas encore (hors périmètre Sprint 3/4) —
// les liens du footer restent des ancres # en attendant.
export default function Home() {
  const t = useTranslations("Landing");

  const features = [
    {
      icon: Sparkles,
      eyebrow: t("features.feature1Eyebrow"),
      title: t("features.feature1Title"),
      body: t("features.feature1Body"),
    },
    {
      icon: ShieldCheck,
      eyebrow: t("features.feature2Eyebrow"),
      title: t("features.feature2Title"),
      body: t("features.feature2Body"),
    },
    {
      icon: Languages,
      eyebrow: t("features.feature3Eyebrow"),
      title: t("features.feature3Title"),
      body: t("features.feature3Body"),
    },
  ];

  const steps = [
    { title: t("howItWorks.step1Title"), body: t("howItWorks.step1Body") },
    { title: t("howItWorks.step2Title"), body: t("howItWorks.step2Body") },
    { title: t("howItWorks.step3Title"), body: t("howItWorks.step3Body") },
  ];

  return (
    <div data-theme="dark" className="relative grain bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-24 pt-40 sm:pt-48">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--secondary)/0.35),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[520px] w-[520px] -translate-x-1/2"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 via-secondary/25 to-transparent blur-3xl" />
            <div className="absolute inset-16 animate-[spin_60s_linear_infinite] rounded-full border border-white/10" />
            <div className="absolute inset-32 animate-[spin_90s_linear_infinite_reverse] rounded-full border border-white/[0.06]" />
          </div>
          <div className="mx-auto max-w-[890px] text-center">
            <Reveal>
              <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {t("hero.eyebrow")}
              </span>
            </Reveal>
            <Reveal delayMs={80}>
              <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight sm:text-6xl">
                {t("hero.title")}
              </h1>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
                {t("hero.subtitle")}
              </p>
            </Reveal>
            <Reveal delayMs={240}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg">{t("hero.cta")}</Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">{t("hero.secondaryCta")}</a>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Early access / social proof */}
        <section className="px-4">
          <Reveal>
            <div className="relative mx-auto flex max-w-[890px] flex-col items-center gap-2 overflow-hidden rounded-card border border-border bg-card px-8 py-10 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-48 w-[70%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
              />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("earlyAccess.eyebrow")}
              </span>
              <h2 className="font-heading text-2xl font-medium">{t("earlyAccess.title")}</h2>
              <p className="text-muted-foreground">{t("earlyAccess.body")}</p>
            </div>
          </Reveal>
        </section>

        {/* Product preview mockup */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-[890px] text-center">
            <Reveal>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("preview.eyebrow")}
              </span>
              <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                {t("preview.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("preview.body")}</p>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="relative mx-auto mt-12 w-full max-w-xs">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-secondary/30 blur-3xl"
                />
                <div className="relative aspect-[9/18] w-full rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-card to-background p-2 shadow-[0_0_80px_-20px_hsl(var(--secondary)/0.7)]">
                  <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-secondary/50 via-background to-background">
                    <div
                      aria-hidden
                      className="absolute inset-x-8 top-12 aspect-square rounded-full bg-gradient-to-br from-amber-300/80 via-orange-500/60 to-transparent blur-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative h-32 w-32">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/80" />
                        <div className="absolute -inset-2 animate-pulse rounded-full border border-primary/30" />
                        <span className="absolute -left-1 -top-1 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-primary" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-primary" />
                        <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-primary" />
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-primary" />
                      </div>
                    </div>
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Sparkles className="h-3 w-3" />
                      AR
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works — trio */}
        <section id="how-it-works" className="px-4 py-24">
          <div className="mx-auto max-w-[890px]">
            <Reveal>
              <div className="text-center">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("howItWorks.eyebrow")}
                </span>
                <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                  {t("howItWorks.title")}
                </h2>
              </div>
            </Reveal>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <Reveal key={step.title} delayMs={i * 100}>
                  <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-6">
                    <span className="font-heading text-sm text-muted-foreground">
                      0{i + 1}
                    </span>
                    <h3 className="font-heading text-lg font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features — 3 rows alternating */}
        <section id="features" className="px-4 py-24">
          <div className="mx-auto max-w-[890px]">
            <Reveal>
              <span className="block text-center text-xs uppercase tracking-wide text-muted-foreground">
                {t("features.eyebrow")}
              </span>
            </Reveal>
            <div className="mt-16 flex flex-col gap-16">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                const reversed = i % 2 === 1;
                return (
                  <Reveal key={feature.title}>
                    <div
                      className={`flex flex-col items-center gap-8 sm:flex-row ${
                        reversed ? "sm:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="relative flex aspect-square w-full max-w-xs shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-gradient-to-br from-card to-background">
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-50"
                          style={{
                            backgroundImage:
                              "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
                            backgroundSize: "18px 18px",
                          }}
                        />
                        <div
                          aria-hidden
                          className="absolute h-28 w-28 rounded-full bg-primary/25 blur-2xl"
                        />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                      </div>
                      <div className={reversed ? "sm:text-right" : ""}>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {feature.eyebrow}
                        </span>
                        <h3 className="mt-2 font-heading text-2xl font-medium">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-muted-foreground">{feature.body}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <PricingSection />

        {/* FAQ */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="text-center">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("faq.eyebrow")}
                </span>
                <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                  {t("faq.title")}
                </h2>
              </div>
            </Reveal>
            <div className="mt-10 flex flex-col divide-y divide-border rounded-card border border-border bg-card">
              {(["q1", "q2", "q3", "q4"] as const).map((key, i) => (
                <Reveal key={key} delayMs={i * 60}>
                  <details className="group px-6 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {t(`faq.${key}`)}
                      <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t(`faq.a${key.slice(1)}`)}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-24">
          <Reveal>
            <div className="relative mx-auto flex max-w-[890px] flex-col items-center gap-6 overflow-hidden rounded-card border border-border bg-card px-8 py-16 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-64 w-[80%] -translate-x-1/2 rounded-full bg-secondary/30 blur-3xl"
              />
              <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                {t("finalCta.title")}
              </h2>
              <Button size="lg">{t("finalCta.cta")}</Button>
              <p className="text-sm text-muted-foreground">{t("finalCta.reassurance")}</p>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-16">
        <div className="mx-auto flex max-w-[890px] flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <span className="font-heading text-lg font-medium">Vorae</span>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground">{t("footer.product")}</span>
              <a href="#features" className="hover:text-foreground">
                {t("footer.features")}
              </a>
              <a href="#pricing" className="hover:text-foreground">
                {t("footer.pricing")}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground">{t("footer.legal")}</span>
              <a href="#" className="hover:text-foreground">
                {t("footer.privacy")}
              </a>
              <a href="#" className="hover:text-foreground">
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[890px] text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vorae. {t("footer.rights")}
        </p>
      </footer>
    </div>
  );
}
