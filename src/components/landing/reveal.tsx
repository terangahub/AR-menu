"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Scroll-reveal minimal — spec reflect.app : fade-in + translateY(8px),
// 350ms, une seule fois, déclenché à 30% de visibilité, respecte
// prefers-reduced-motion (visible immédiatement dans ce cas).
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
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
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
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
        transitionDuration: "350ms",
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
