import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { SiteHeader } from "@/components/landing/site-header";
import { PricingSection } from "@/components/landing/pricing-section";
import { TrustedMarquee } from "@/components/landing/trusted-marquee";
import { ReviewsSection } from "@/components/landing/reviews-section";
import { AboutSection } from "@/components/landing/about-section";
import { BackToTop } from "@/components/landing/back-to-top";
import { GlobeSection } from "@/components/landing/globe-section";
import { FeatureField } from "@/components/landing/feature-field";
import {
  ShieldCheck,
  Languages,
  ScanLine,
  Box,
  UtensilsCrossed,
  MessageSquareOff,
  Sparkles,
} from "lucide-react";

// Contenu des champs défilants illustrant chaque bénéfice. Chaque liste
// dit littéralement de quoi parle la section : les questions que les
// serveurs n'ont plus à répondre, les allergènes couverts, le même plat
// écrit dans plusieurs langues.
const FIELD_WORDS = {
  service: [
    "C'est servi avec quoi ?",
    "C'est épicé ?",
    "Quelle taille de portion ?",
    "Il y a des noix dedans ?",
    "C'est quoi le plat du jour ?",
    "Ça vient avec des frites ?",
    "C'est gros comme assiette ?",
    "Vous avez du végé ?",
    "C'est long à préparer ?",
    "Ça ressemble à quoi ?",
  ],
  allergens: [
    "Gluten",
    "Arachides",
    "Crustacés",
    "Lait",
    "Oeufs",
    "Poisson",
    "Soja",
    "Fruits à coque",
    "Sésame",
    "Sulfites",
    "Moutarde",
    "Céleri",
  ],
  languages: [
    "Bol signature",
    "Signature bowl",
    "Cuenco de autor",
    "Signature-Bowl",
    "Ciotola signature",
    "招牌碗",
    "시그니처 볼",
    "シグネチャーボウル",
    "وعاء مميز",
    "Tigela assinatura",
    "Фирменная чаша",
    "Handtekening kom",
  ],
} as const;

// Landing marketing - direction reflect.app (voir CONTEXT.md pour la
// justification du remplacement de palette). Force le thème sombre
// localement : reflect.app n'a pas de mode clair, le dashboard garde sa
// préférence système par défaut (voir [locale]/layout.tsx). Les pages
// /privacy et /terms n'existent pas encore (hors périmètre Sprint 3/4),
// les liens du footer restent des ancres # en attendant.
export default function Home() {
  const t = useTranslations("Landing");

  const features = [
    {
      icon: MessageSquareOff,
      eyebrow: t("features.feature1Eyebrow"),
      title: t("features.feature1Title"),
      body: t("features.feature1Body"),
      words: FIELD_WORDS.service,
      fieldLabel: t("features.field1Label"),
    },
    {
      icon: ShieldCheck,
      eyebrow: t("features.feature2Eyebrow"),
      title: t("features.feature2Title"),
      body: t("features.feature2Body"),
      words: FIELD_WORDS.allergens,
      fieldLabel: t("features.field2Label"),
    },
    {
      icon: Languages,
      eyebrow: t("features.feature3Eyebrow"),
      title: t("features.feature3Title"),
      body: t("features.feature3Body"),
      words: FIELD_WORDS.languages,
      fieldLabel: t("features.field3Label"),
    },
  ];

  const steps = [
    { icon: ScanLine, title: t("howItWorks.step1Title"), body: t("howItWorks.step1Body") },
    { icon: Box, title: t("howItWorks.step2Title"), body: t("howItWorks.step2Body") },
    { icon: UtensilsCrossed, title: t("howItWorks.step3Title"), body: t("howItWorks.step3Body") },
  ];

  return (
    <div data-theme="dark" className="grain relative overflow-x-clip bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-28 pt-36 sm:pt-44">
          {/* Aurore de fond : dégradé radial large + orbe centrale floue.
              Deux couches distinctes pour éviter un halo trop uniforme. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-[radial-gradient(70%_55%_at_50%_-5%,hsl(var(--secondary)/0.45),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-160px] -z-10 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.22),transparent)] blur-3xl"
          />
          {/* Grille en perspective, très discrète - donne une profondeur de
              "produit tech" sans dominer la composition. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] opacity-[0.18] [mask-image:radial-gradient(65%_55%_at_50%_0%,#000,transparent)]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          <div className="mx-auto max-w-[1100px] text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {t("hero.eyebrow")}
              </span>
            </Reveal>
            <Reveal delayMs={80}>
              <h1 className="text-gradient mx-auto mt-8 max-w-4xl text-balance font-heading text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
                {t("hero.title")}
              </h1>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
                {t("hero.subtitle")}
              </p>
            </Reveal>
            <Reveal delayMs={240}>
              <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="w-full shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] sm:w-auto">
                  {t("hero.cta")}
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <a href="#how-it-works">{t("hero.secondaryCta")}</a>
                </Button>
              </div>
            </Reveal>

            <Reveal delayMs={340}>
              <div className="relative mx-auto mt-20 max-w-4xl">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-full bg-secondary/25 blur-3xl"
                />
                <div className="border-gradient overflow-hidden rounded-card bg-card shadow-[0_30px_120px_-30px_hsl(var(--secondary))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-dish.jpg"
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
                {/* Reflet sous l'image - l'illusion d'une surface polie,
                    masqué en dégradé pour s'éteindre progressivement. */}
                <div
                  aria-hidden
                  className="pointer-events-none mx-auto h-24 w-[85%] scale-y-[-1] overflow-hidden rounded-card opacity-25 [mask-image:linear-gradient(to_top,#000,transparent)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero-dish.jpg" alt="" className="w-full object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <TrustedMarquee />

        {/* Early access / social proof */}
        <section className="px-5">
          <Reveal>
            <div className="border-gradient relative mx-auto flex max-w-[1100px] flex-col items-center gap-3 overflow-hidden rounded-card bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-8 py-12 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
              />
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                {t("earlyAccess.eyebrow")}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight sm:text-3xl">
                {t("earlyAccess.title")}
              </h2>
              <p className="max-w-lg text-muted-foreground">{t("earlyAccess.body")}</p>
            </div>
          </Reveal>
        </section>

        {/* Product preview */}
        <section className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-[1100px] text-center">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {t("preview.eyebrow")}
              </span>
              <h2 className="text-gradient mx-auto mt-6 max-w-2xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
                {t("preview.title")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                {t("preview.body")}
              </p>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="relative mx-auto mt-14 w-full max-w-3xl">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-secondary/30 blur-3xl"
                />
                <div className="border-gradient relative overflow-hidden rounded-card bg-card shadow-[0_30px_120px_-30px_hsl(var(--secondary))]">
                  <video
                    src="/hero-video.mp4"
                    poster="/hero-dish.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AR
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works - trio */}
        <section id="how-it-works" className="relative px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-[1100px]">
            <Reveal>
              <div className="text-center">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("howItWorks.eyebrow")}
                </span>
                <h2 className="text-gradient mx-auto mt-6 max-w-2xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
                  {t("howItWorks.title")}
                </h2>
              </div>
            </Reveal>

            <div className="relative mt-16">
              {/* Ligne de liaison entre les 3 étapes (desktop seulement) :
                  matérialise la progression scan vers AR vers commande. */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent sm:block"
              />
              <div className="grid gap-6 sm:grid-cols-3">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <Reveal key={step.title} delayMs={i * 100} className="h-full">
                      <div className="surface-card flex h-full flex-col items-center gap-4 p-8 text-center">
                        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-secondary/30 backdrop-blur">
                          <Icon className="h-6 w-6 text-primary" />
                          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-heading text-[11px] font-semibold text-primary-foreground">
                            {i + 1}
                          </span>
                        </span>
                        <h3 className="font-heading text-xl font-medium tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features - 3 rangées alternées */}
        <section id="features" className="relative px-5 py-28 sm:py-36">
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.22),transparent)] blur-2xl"
          />
          <div className="mx-auto max-w-[1100px]">
            <Reveal>
              <div className="text-center">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("features.eyebrow")}
                </span>
              </div>
            </Reveal>
            <div className="mt-16 flex flex-col gap-20 sm:gap-28">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                const reversed = i % 2 === 1;
                return (
                  <Reveal key={feature.title}>
                    <div
                      className={`flex flex-col items-center gap-10 sm:flex-row sm:gap-16 ${
                        reversed ? "sm:flex-row-reverse" : ""
                      }`}
                    >
                      <div className="relative w-full shrink-0 sm:w-[46%]">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-secondary/25 blur-3xl"
                        />
                        <div className="border-gradient overflow-hidden rounded-card shadow-[0_20px_70px_-25px_hsl(var(--secondary))]">
                          <FeatureField
                            words={[...feature.words]}
                            icon={Icon}
                            label={feature.fieldLabel}
                          />
                        </div>
                      </div>

                      <div className={`flex-1 ${reversed ? "sm:text-right" : ""}`}>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-primary ${
                            reversed ? "sm:flex-row-reverse" : ""
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {feature.eyebrow}
                        </span>
                        <h3 className="mt-5 text-balance font-heading text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                          {feature.title}
                        </h3>
                        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                          {feature.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <GlobeSection />

        <ReviewsSection />

        <AboutSection />

        <PricingSection />

        {/* FAQ */}
        <section className="px-5 py-28 sm:py-36">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="text-center">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("faq.eyebrow")}
                </span>
                <h2 className="text-gradient mt-6 text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
                  {t("faq.title")}
                </h2>
              </div>
            </Reveal>
            <div className="mt-12 flex flex-col gap-3">
              {(["q1", "q2", "q3", "q4"] as const).map((key, i) => (
                <Reveal key={key} delayMs={i * 60}>
                  <details className="surface-card group px-6 py-5 [&[open]]:from-white/[0.09]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {t(`faq.${key}`)}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {t(`faq.a${key.slice(1)}`)}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-5 pb-28 sm:pb-36">
          <Reveal>
            <div className="border-gradient relative mx-auto flex max-w-[1100px] flex-col items-center gap-7 overflow-hidden rounded-card bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-8 py-20 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[85%] -translate-x-1/2 rounded-full bg-secondary/40 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[60%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
              />
              <h2 className="text-gradient max-w-2xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
                {t("finalCta.title")}
              </h2>
              <Button size="lg" className="shadow-[0_0_50px_-10px_hsl(var(--primary)/0.8)]">
                {t("finalCta.cta")}
              </Button>
              <p className="text-sm text-muted-foreground">{t("finalCta.reassurance")}</p>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 py-16">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-12 sm:flex-row sm:justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-heading text-lg font-medium tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-secondary/40 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.png" alt="" className="h-5 w-5" />
              </span>
              Vorae
            </span>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("footer.product")}
              </span>
              <a href="#features" className="text-foreground/80 transition-colors hover:text-foreground">
                {t("footer.features")}
              </a>
              <a href="#pricing" className="text-foreground/80 transition-colors hover:text-foreground">
                {t("footer.pricing")}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("footer.legal")}
              </span>
              <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">
                {t("footer.privacy")}
              </a>
              <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-[1100px] border-t border-white/[0.06] pt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vorae. {t("footer.rights")}
        </p>
      </footer>

      <BackToTop />
    </div>
  );
}
