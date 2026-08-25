"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

// Visuel de la section "Langues" : le nom du plat bascule d'une langue à
// l'autre comme un panneau d'aéroport à palettes, plutôt qu'un champ de
// texte qui défile horizontalement - l'idée de bascule illustre mieux la
// traduction que le défilement, et différencie cette carte des deux
// autres.
//
// La bascule est pilotée en JavaScript (un index qui avance), pas par des
// keyframes CSS décalées. Première tentative, qui a bugué : toutes les
// langues partageaient une animation CSS avec un délai négatif décalé,
// mais les pourcentages de keyframes s'expriment par rapport au cycle
// entier, pas au créneau d'une langue - avec 12 langues, une dizaine
// restaient à `opacity: 1` en même temps et le texte s'empilait,
// illisible. Des pourcentages corrects dépendraient du nombre de langues,
// or les keyframes CSS ne peuvent pas être paramétrées. Un index en JS
// n'a pas cette limite et reste correct quel que soit le nombre.
//
// L'animation elle-même reste en CSS (transition sur opacity/transform) :
// seul le choix de la langue affichée passe par React.
//
// L'icône est importée ici plutôt que reçue en prop, contrairement aux
// deux autres cartes : ce fichier étant un Client Component rendu à
// l'intérieur de `Reveal` (client lui aussi), tout ce qui lui est passé
// en prop doit être sérialisable. Une icône lucide est un objet
// `forwardRef`, donc une fonction, et provoquait à l'exécution
// "Functions cannot be passed directly to Client Components" - erreur
// invisible au build, la page renvoyait un 500. Un élément React déjà
// rendu ne passe pas non plus, son `type` restant cette même fonction.
// Les deux autres cartes gardent une prop `LucideIcon` sans problème :
// elles sont restées des Server Components.
// Le cycle se joue en deux temps, en boucle : un "flash-back" qui balaie
// toutes les langues à toute vitesse, puis une lecture posée langue par
// langue. Le balayage rapide fait sentir d'un coup l'étendue des langues
// couvertes, la lecture lente laisse le temps de lire chacune.
const FLASH_MS = 80;
const SLOT_MS = 2200;
// Deux passages complets en accéléré : un seul se lit comme un raté,
// deux se lisent clairement comme une avance rapide volontaire.
const FLASH_SWEEPS = 2;

export function FeatureLanguageFlip({
  names,
  label,
}: {
  names: readonly string[];
  label: string;
}) {
  const [step, setStep] = useState(0);

  const flashSteps = names.length * FLASH_SWEEPS;
  const totalSteps = flashSteps + names.length;
  const flashing = step < flashSteps;
  const index = step % names.length;

  // `setTimeout` relancé à chaque pas plutôt qu'un `setInterval` : le
  // délai change selon la phase, un intervalle fixe ne saurait pas
  // alterner rapide et lent.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const delay = step < flashSteps ? FLASH_MS : SLOT_MS;
    const id = setTimeout(() => {
      setStep((current) => (current + 1) % totalSteps);
    }, delay);
    return () => clearTimeout(id);
  }, [step, flashSteps, totalSteps]);

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
          {names.map((name, i) => {
            const active = i === index;
            return (
              <span
                key={name}
                className="absolute inset-0 flex items-center justify-center text-balance text-center font-heading text-lg font-medium leading-tight text-foreground ease-out sm:text-xl"
                style={{
                  opacity: active ? (flashing ? 0.75 : 1) : 0,
                  // Pendant le flash-back, pas de bascule : les langues se
                  // succèdent trop vite pour qu'une rotation se lise, et un
                  // léger flou vend la vitesse. La bascule reprend en
                  // lecture posée.
                  transform: flashing
                    ? "none"
                    : active
                      ? "rotateX(0deg)"
                      : "rotateX(-90deg)",
                  filter: flashing ? "blur(0.6px)" : "none",
                  transitionProperty: "opacity, transform, filter",
                  transitionDuration: flashing ? "60ms" : "500ms",
                  backfaceVisibility: "hidden",
                }}
              >
                {name}
              </span>
            );
          })}
        </div>

        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.8)] backdrop-blur-sm">
          <Languages className="h-6 w-6 text-primary" />
        </span>
      </div>

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
