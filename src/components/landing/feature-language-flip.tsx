import type { LucideIcon } from "lucide-react";

// Visuel de la section "Langues" : le nom du plat bascule d'une langue à
// l'autre comme un panneau d'aéroport à palettes, plutôt qu'un champ de
// texte qui défile horizontalement - l'idée de bascule illustre mieux la
// traduction que le défilement, et différencie cette carte des deux
// autres.
//
// Toutes les langues partagent la même animation CSS, mais avec un
// délai négatif décalé d'un cran chacune (`-i * SLOT_SECONDS`) : elles
// démarrent donc déjà à des phases différentes d'un seul et même cycle
// partagé, ce qui donne l'alternance round-robin sans JavaScript ni état
// - et sans le "sursaut" qu'un délai positif provoquerait au chargement
// (tout serait invisible le temps que le premier délai s'écoule).
const SLOT_SECONDS = 3;

export function FeatureLanguageFlip({
  names,
  icon: Icon,
  label,
}: {
  names: readonly string[];
  icon: LucideIcon;
  label: string;
}) {
  const cycleDuration = names.length * SLOT_SECONDS;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-white/[0.08] bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.5),transparent)]"
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        style={{ perspective: "600px" }}
      >
        <div className="relative h-16 w-[88%] sm:h-20">
          {names.map((name, i) => (
            <span
              key={name}
              className="language-flip absolute inset-0 flex items-center justify-center text-center font-heading text-lg font-medium leading-tight text-foreground sm:text-xl"
              style={{
                animationDuration: `${cycleDuration}s`,
                animationDelay: `${-i * SLOT_SECONDS}s`,
              }}
            >
              {name}
            </span>
          ))}
        </div>

        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.8)] backdrop-blur-sm">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </div>

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
