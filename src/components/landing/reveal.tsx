"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isRevealSuppressed } from "@/lib/reveal-suppress";

// Scroll-reveal : fade-in + translateY(8px) sur 350ms, déclenché à 30% de
// visibilité, respecte prefers-reduced-motion (visible immédiatement).
//
// L'animation se rejoue dans les deux sens de défilement, à la demande du
// client. Deux seuils au lieu d'un pour éviter le clignotement au ras de
// la limite : l'élément apparaît quand 30% est visible, mais ne se
// réarme que lorsqu'il est entièrement sorti du cadre (ratio 0). Avec un
// seuil unique, un micro-scroll autour de la limite ferait clignoter
// l'élément.
//
// Pendant un défilement programmatique long (le bouton retour en haut),
// ce rejeu dans les deux sens fait clignoter toutes les sections
// traversées d'un coup, comme si la page se relisait. `isRevealSuppressed`
// ignore alors les changements d'intersection le temps du défilement, cf.
// `lib/reveal-suppress.ts`.
export function Reveal({
  children,
  className,
  delayMs = 0,
  durationMs = 350,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isRevealSuppressed()) return;
        if (entry.intersectionRatio >= 0.3) {
          setVisible(true);
        } else if (entry.intersectionRatio === 0) {
          setVisible(false);
        }
      },
      { threshold: [0, 0.3] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
