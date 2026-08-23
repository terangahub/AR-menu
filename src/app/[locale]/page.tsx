import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { SiteHeader } from "@/components/landing/site-header";
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
    <div data-theme="dark" className="bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-24 pt-40 sm:pt-48">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--secondary)/0.35),transparent)]"
          />
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
            <div className="mx-auto flex max-w-[890px] flex-col items-center gap-2 rounded-card border border-border bg-card px-8 py-10 text-center">
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
              <div className="mt-12 aspect-video w-full rounded-card border border-border bg-card" />
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
                      <div className="flex aspect-square w-full max-w-xs shrink-0 items-center justify-center rounded-card border border-border bg-card">
                        <Icon className="h-10 w-10 text-primary" />
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

        {/* Final CTA */}
        <section className="px-4 py-24">
          <Reveal>
            <div className="mx-auto flex max-w-[890px] flex-col items-center gap-6 rounded-card border border-border bg-card px-8 py-16 text-center">
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
