import { useTranslations } from "next-intl";

// Section À propos (cahier section 12.1), design repris de webglow.ca :
// badge à pastille, très grand titre dont une partie passe en dégradé,
// sous-titre, et particules qui montent en fond.
//
// WebGlow utilise le composant Particles de Magic UI (canvas, 246 lignes,
// dépendance supplémentaire). Ici les particules sont de simples points
// en CSS avec l'animation `animate-float-up` : le rendu visuel est le
// même à cette échelle, sans ajouter de dépendance ni de canvas animé en
// continu. Positions figées en dur plutôt que Math.random() : une valeur
// aléatoire différente entre le rendu serveur et le rendu client
// provoquerait une erreur d'hydratation React.
const PARTICLES = [
  { left: "8%", top: "62%", delay: "0s", duration: "11s", size: 2 },
  { left: "17%", top: "38%", delay: "2.4s", duration: "13s", size: 1 },
  { left: "26%", top: "74%", delay: "1.1s", duration: "10s", size: 2 },
  { left: "34%", top: "26%", delay: "3.6s", duration: "14s", size: 1 },
  { left: "43%", top: "55%", delay: "0.7s", duration: "12s", size: 2 },
  { left: "52%", top: "80%", delay: "4.2s", duration: "11s", size: 1 },
  { left: "61%", top: "33%", delay: "1.8s", duration: "15s", size: 2 },
  { left: "69%", top: "68%", delay: "3.1s", duration: "10s", size: 1 },
  { left: "78%", top: "45%", delay: "0.4s", duration: "13s", size: 2 },
  { left: "87%", top: "71%", delay: "2.9s", duration: "12s", size: 1 },
  { left: "93%", top: "30%", delay: "5s", duration: "14s", size: 1 },
  { left: "12%", top: "18%", delay: "1.5s", duration: "16s", size: 1 },
];

export function AboutSection() {
  const t = useTranslations("Landing.about");

  return (
    <section id="about" className="relative w-full overflow-hidden py-28 sm:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="animate-float-up absolute rounded-full bg-foreground/70"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.25),transparent)] blur-2xl"
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 text-center">
        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("eyebrow")}
          </span>
        </span>

        <h2 className="mx-auto mt-8 max-w-4xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
          {t("titleLead")}{" "}
          <span className="text-muted-foreground">{t("titleMuted")}</span>{" "}
          <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            {t("titleAccent")}
          </span>
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
      </div>
    </section>
  );
}
