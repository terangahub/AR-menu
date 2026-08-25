"use client";

import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { suppressReveal } from "@/lib/reveal-suppress";

// Bouton "retour en haut" en forme de fusée, repris de webglow.ca :
// apparaît après 500px de scroll, réacteur qui s'allume au survol et
// pendant le décollage. Couleurs adaptées aux tokens Vorae.
//
// Défilement fait à la main plutôt que `scrollTo({ behavior: "smooth" })` :
// la durée native du navigateur dépend de la distance et peut être très
// courte sur une page longue, ce qui fait défiler toutes les sections à
// toute vitesse - une expérience que le client a décrite comme "on dirait
// qu'on recommence à relire la page". Une durée fixe et un easing doux
// donnent un mouvement plus posé, quelle que soit la distance.
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function smoothScrollToTop(durationMs: number) {
  const start = window.scrollY;
  if (start === 0) return;
  const startTime = performance.now();

  function step(now: number) {
    const progress = Math.min(1, (now - startTime) / durationMs);
    window.scrollTo(0, start * (1 - easeOutCubic(progress)));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    setLaunching(true);
    const duration = 1100;
    suppressReveal(duration + 150);
    smoothScrollToTop(duration);
    // Le décollage est purement décoratif : on le coupe après une durée
    // fixe, alignée sur celle du défilement.
    setTimeout(() => setLaunching(false), duration);
  }

  return (
    <div
      className={`fixed bottom-8 right-8 z-40 transform transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Retour en haut"
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-background shadow-[0_0_30px_-8px_hsl(var(--secondary))] transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)] active:scale-95 ${
          launching ? "animate-bounce" : ""
        }`}
      >
        <Rocket
          size={22}
          className={`-rotate-45 transition-transform duration-300 ${
            launching ? "-translate-y-1 text-primary" : "text-foreground group-hover:-translate-y-1"
          }`}
        />
        <span
          aria-hidden
          className={`absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary blur-[2px] transition-all duration-300 ${
            launching ? "scale-150 opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        />
        <span
          aria-hidden
          className={`absolute -bottom-1 left-1/2 w-1 -translate-x-1/2 rounded-full bg-secondary blur-[1px] transition-all duration-300 ${
            launching ? "h-6 opacity-100" : "h-3 opacity-0 group-hover:opacity-100"
          }`}
        />
      </button>
    </div>
  );
}
