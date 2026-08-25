import type { LucideIcon } from "lucide-react";

// Visuel de la section "Service" (moins d'interruptions en salle) : les
// questions des clients montent comme des bulles de conversation puis
// s'effacent, façon eau qui petille - plutot qu'un champ de texte
// horizontal identique aux deux autres sections, pour que chaque carte
// de "Pourquoi Vorae" ait sa propre mecanique visuelle.
//
// Positions et delais figes en dur (pas de Math.random) : une valeur
// aleatoire differente entre le rendu serveur et le rendu client
// provoquerait une erreur d'hydratation React, meme raison que les
// autres champs deterministes du projet (feature-field.tsx, etc.).
const BUBBLES = [
  { left: "6%", delay: 0, duration: 15 },
  { left: "58%", delay: 2.4, duration: 17 },
  { left: "22%", delay: 5.8, duration: 14 },
  { left: "76%", delay: 1.2, duration: 16 },
  { left: "40%", delay: 8.6, duration: 15 },
  { left: "88%", delay: 4.4, duration: 17 },
  { left: "12%", delay: 10.8, duration: 14 },
  { left: "64%", delay: 7.2, duration: 16 },
];

export function FeatureChatCloud({
  questions,
  icon: Icon,
  label,
}: {
  questions: readonly string[];
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-white/[0.08] bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.5),transparent)]"
      />

      <div
        aria-hidden
        className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]"
      >
        {BUBBLES.map((bubble, i) => (
          <span
            key={i}
            className="chat-bubble absolute whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-1.5 font-mono text-[10px] text-foreground/80 backdrop-blur-sm sm:text-[11px]"
            style={{
              left: bubble.left,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          >
            {questions[i % questions.length]}
          </span>
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.8)] backdrop-blur-sm">
          <Icon className="h-6 w-6 text-primary" />
        </span>
        <span className="rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  );
}
