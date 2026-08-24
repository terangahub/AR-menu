"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

// Globe en pointillés qui tourne lentement, avec un marqueur sur
// Montréal. Inspiré de la section "dotted across the globe" de
// reflect.app, fournie en vidéo par le client.
//
// Rendu en canvas 2D plutôt qu'avec une librairie de globe (cobe,
// three.js) : quelques dizaines de lignes suffisent pour une projection
// orthographique, contre une dépendance de plusieurs centaines de Ko.
//
// Volontairement sans contours de continents : les dessiner demanderait
// un jeu de données de côtes que nous n'avons pas, et une carte du monde
// visiblement fausse sur une page commerciale serait pire qu'une sphère
// abstraite. Un seul point réel est marqué, Montréal, qui est le marché
// de lancement (section 24 du cahier). Aucun autre point ne prétend
// représenter un client.
const MONTREAL = { lat: 45.5, lon: -73.6 };

// Bandes de latitude tous les 3 degrés. Le nombre de points par bande
// suit cos(latitude) pour que l'espacement reste régulier à la surface
// de la sphère, sinon les points se tassent aux pôles.
function buildDots() {
  const dots: { lat: number; lon: number }[] = [];
  for (let lat = -80; lat <= 80; lat += 2.4) {
    const rad = (lat * Math.PI) / 180;
    const count = Math.max(8, Math.round(Math.cos(rad) * 118));
    for (let i = 0; i < count; i++) {
      dots.push({ lat, lon: (i / count) * 360 - 180 });
    }
  }
  return dots;
}

export function GlobeSection() {
  const t = useTranslations("Landing.globe");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = buildDots();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rotation = 0;
    let raf = 0;
    let running = true;
    let lastTime = performance.now();

    // Lecture des couleurs du thème : le composant doit suivre la bascule
    // sombre/clair, donc on résout les tokens CSS au lieu de coder des
    // couleurs en dur.
    const styles = getComputedStyle(canvas);
    const fg = styles.getPropertyValue("--foreground").trim();
    const primary = styles.getPropertyValue("--primary").trim();

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(lat: number, lon: number, cx: number, cy: number, r: number) {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = ((lon + rotation) * Math.PI) / 180;
      const x = Math.cos(latRad) * Math.sin(lonRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lonRad);
      return { x: cx + x * r, y: cy - y * r, z };
    }

    function draw(now: number) {
      if (!canvas || !ctx) return;
      const delta = now - lastTime;
      lastTime = now;
      if (!reduced) {
        // Un tour complet en environ 60 secondes, indépendamment du
        // nombre d'images par seconde de l'appareil.
        rotation += (delta / 60000) * 360;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Le globe déborde volontairement sous le cadre : seule la calotte
      // supérieure est visible, comme sur la référence.
      const r = Math.min(w * 0.42, 460);
      const cx = w / 2;
      const cy = h * 0.16 + r;

      for (const dot of dots) {
        const p = project(dot.lat, dot.lon, cx, cy, r);
        if (p.z <= 0) continue; // face cachée
        // Les points proches du bord (z faible) s'estompent, ce qui donne
        // le volume sans avoir à dessiner d'ombrage.
        const alpha = 0.22 + p.z * 0.62;
        const size = 1 + p.z * 1.3;
        ctx.fillStyle = `hsl(${fg} / ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Marqueur Montréal, avec un halo qui pulse.
      const m = project(MONTREAL.lat, MONTREAL.lon, cx, cy, r);
      if (m.z > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 700);
        ctx.fillStyle = `hsl(${primary} / ${0.12 + pulse * 0.18})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 9 + pulse * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(${primary} / 0.95)`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    // L'animation est coupée quand la section sort du cadre : un
    // requestAnimationFrame qui tourne en permanence sur une page longue
    // chauffe la batterie pour rien.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          lastTime = performance.now();
          raf = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="relative overflow-hidden px-5 pt-28 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.3),transparent)] blur-2xl"
      />

      <div className="relative z-10 mx-auto max-w-[1100px] text-center">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("eyebrow")}
          </span>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-gradient mx-auto mt-6 max-w-3xl text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{t("body")}</p>
        </Reveal>
        <Reveal delayMs={240}>
          <Button variant="outline" size="sm" className="mt-8" asChild>
            <a href="#how-it-works">{t("cta")}</a>
          </Button>
        </Reveal>
      </div>

      {/* Le globe est masqué en bas pour se fondre dans la section
          suivante plutôt que de s'arrêter sur une ligne nette. */}
      <div className="relative mx-auto mt-2 h-[300px] w-full max-w-[1100px] [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] sm:h-[380px]">
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      </div>
    </section>
  );
}
