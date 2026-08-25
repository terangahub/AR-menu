"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    // Sous-ensemble de points existants que le balayage peut "detecter" en
    // les croisant (cf. plus bas) : pas de nouveaux marqueurs qui
    // pretendraient representer des lieux reels, juste quelques points de
    // la grille deja affichee qui repondent au passage du radar.
    const blipDots = dots.filter((_, i) => i % 53 === 0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rotation = 0;
    // Rotation manuelle ajoutee par le glisser : persiste apres le
    // relachement, la rotation automatique repart de la ou l'utilisateur
    // a laisse le globe plutot que de sauter en arriere.
    let dragOffset = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    // Point de pression ("presser l'eponge") : une force qui monte vite a
    // l'appui et redescend lentement au relachement, cf. son usage dans
    // draw() plus bas.
    const press = { x: 0, y: 0, strength: 0, active: false };
    let raf = 0;
    let running = true;
    let lastTime = performance.now();

    // Lecture des couleurs du thème : le composant doit suivre la bascule
    // sombre/clair, donc on résout les tokens CSS au lieu de coder des
    // couleurs en dur.
    const styles = getComputedStyle(canvas);
    const fg = styles.getPropertyValue("--foreground").trim();
    const primary = styles.getPropertyValue("--primary").trim();
    const secondary = styles.getPropertyValue("--secondary").trim();

    // `createConicGradient` fait le balayage electrique ci-dessous ;
    // navigateur ancien sans support, on saute juste ce dessin, le globe
    // reste utilisable sans lui.
    const supportsConicGradient = typeof ctx.createConicGradient === "function";

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
      const lonRad = ((lon + rotation + dragOffset) * Math.PI) / 180;
      const x = Math.cos(latRad) * Math.sin(lonRad);
      const y = Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lonRad);
      return { x: cx + x * r, y: cy - y * r, z };
    }

    // Detection generique utilisee pour Montreal et pour les points radar :
    // renvoie 0..1 selon la proximite angulaire entre `pointAngle` et le
    // balayage, 0 au-dela de `spread` radians d'ecart.
    function detect(pointAngle: number, sweepAngle: number, spread: number) {
      let diff = Math.abs(pointAngle - sweepAngle) % (Math.PI * 2);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      return Math.max(0, 1 - diff / spread);
    }

    function draw(now: number) {
      if (!canvas || !ctx) return;
      const delta = now - lastTime;
      lastTime = now;
      if (!reduced && !dragging) {
        // Un tour complet en environ 60 secondes, indépendamment du
        // nombre d'images par seconde de l'appareil. Suspendu pendant le
        // glisser pour ne pas cumuler avec le geste de l'utilisateur ;
        // reprend ensuite exactement d'où il l'a laissé.
        rotation += (delta / 60000) * 360;
      }

      // Force de pression : monte vite a l'appui, redescend lentement au
      // relachement ("comme une eponge qu'on relache").
      if (press.active) {
        press.strength += (1 - press.strength) * 0.35;
      } else if (press.strength > 0.001) {
        press.strength *= 0.94;
      } else {
        press.strength = 0;
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
      const dentRadius = r * 0.22;

      for (const dot of dots) {
        const p = project(dot.lat, dot.lon, cx, cy, r);
        if (p.z <= 0) continue; // face cachée
        // Les points proches du bord (z faible) s'estompent, ce qui donne
        // le volume sans avoir à dessiner d'ombrage.
        let alpha = 0.22 + p.z * 0.62;
        let size = 1 + p.z * 1.3;
        let px = p.x;
        let py = p.y;

        // Empreinte de pression : les points proches du doigt/curseur sont
        // tires vers le point d'appui et s'assombrissent legerement, comme
        // une surface qui s'enfonce puis reprend sa forme.
        if (press.strength > 0.01) {
          const dist = Math.hypot(p.x - press.x, p.y - press.y);
          if (dist < dentRadius) {
            const fall = (1 - dist / dentRadius) * press.strength;
            px = p.x + (press.x - p.x) * fall * 0.4;
            py = p.y + (press.y - p.y) * fall * 0.4;
            alpha *= 1 - fall * 0.5;
            size *= 1 - fall * 0.35;
          }
        }

        ctx.fillStyle = `hsl(${fg} / ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Balayage electrique : un secteur lumineux qui tourne, bien plus
      // lentement qu'un radar de film pour rester discret sur une page
      // commerciale, et qui fait "reagir" quelques points de la sphere a
      // son passage (cf. blipDots) plutot que de decorer le globe au
      // hasard. Independant de `rotation`, qui pilote la sphere elle-meme.
      const sweepAngle = ((now / 1000) * ((Math.PI * 2) / 16)) % (Math.PI * 2);
      if (supportsConicGradient && !reduced) {
        const sweepGradient = ctx.createConicGradient(sweepAngle, cx, cy);
        sweepGradient.addColorStop(0, `hsl(${primary} / 0.5)`);
        sweepGradient.addColorStop(0.025, `hsl(${secondary} / 0.32)`);
        sweepGradient.addColorStop(0.07, "transparent");
        sweepGradient.addColorStop(1, "transparent");
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = sweepGradient;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.restore();

        // Trait net qui suit le meme angle, le long du bord de la
        // sphere : le degrade conique seul reste diffus sur une zone
        // aussi grande que le globe, ce trait donne le "coup de laser"
        // qui se voit vraiment au passage.
        ctx.save();
        ctx.strokeStyle = `hsl(${primary} / 0.9)`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `hsl(${primary})`;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, r, sweepAngle - 0.04, sweepAngle + 0.04);
        ctx.stroke();
        ctx.restore();

        // Points radar : quelques points de la grille "detectes" au
        // passage du balayage, comme un radar qui fait apparaitre puis
        // disparaitre un contact.
        for (const dot of blipDots) {
          const bp = project(dot.lat, dot.lon, cx, cy, r);
          if (bp.z <= 0.15) continue;
          const angle = Math.atan2(bp.y - cy, bp.x - cx);
          const blip = detect(angle, sweepAngle, 0.22);
          if (blip < 0.05) continue;
          ctx.strokeStyle = `hsl(${primary} / ${blip * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, 3 + (1 - blip) * 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `hsl(${primary} / ${blip})`;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Marqueur Montréal : halo qui pulse en continu, et qui "reagit"
      // quand le balayage le traverse, comme un point detecte par un
      // scan plutot qu'une simple pastille decorative.
      const m = project(MONTREAL.lat, MONTREAL.lon, cx, cy, r);
      if (m.z > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 700);
        let flash = 0;
        if (supportsConicGradient && !reduced) {
          const montrealAngle = Math.atan2(m.y - cy, m.x - cx);
          flash = detect(montrealAngle, sweepAngle, 0.35);
        }
        ctx.fillStyle = `hsl(${primary} / ${0.12 + pulse * 0.18 + flash * 0.35})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 9 + pulse * 7 + flash * 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsl(${primary} / 0.95)`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3 + flash * 2, 0, Math.PI * 2);
        ctx.fill();
        if (flash > 0.3) {
          ctx.strokeStyle = `hsl(${primary} / ${flash * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 14 + (1 - flash) * 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (running) raf = requestAnimationFrame(draw);
    }

    // Glisser pour tourner le globe soi-meme, en plus de la rotation
    // automatique. `setPointerCapture` garde les evenements meme si le
    // doigt/curseur sort du canvas pendant le geste.
    function toCanvasPoint(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      dragStartX = e.clientX;
      dragStartOffset = dragOffset;
      const pt = toCanvasPoint(e);
      press.active = true;
      press.x = pt.x;
      press.y = pt.y;
      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        const deltaX = e.clientX - dragStartX;
        dragOffset = dragStartOffset + deltaX * 0.25;
      }
      if (press.active) {
        const pt = toCanvasPoint(e);
        press.x = pt.x;
        press.y = pt.y;
      }
    }

    function onPointerUp(e: PointerEvent) {
      dragging = false;
      press.active = false;
      canvas!.releasePointerCapture(e.pointerId);
      canvas!.style.cursor = "grab";
    }

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

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
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden px-5 pt-28 sm:pt-36">
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
          <Button className="mt-8 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)]" asChild>
            <Link href="/dashboard">{t("cta")}</Link>
          </Button>
        </Reveal>
      </div>

      {/* Le globe est masqué en bas pour se fondre dans la section
          suivante plutôt que de s'arrêter sur une ligne nette. Manipulable
          à la souris/au doigt (glisser pour tourner, appuyer pour
          l'enfoncer), cf. le useEffect ci-dessus. */}
      <div className="relative mx-auto mt-2 h-[300px] w-full max-w-[1100px] [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] sm:h-[380px]">
        <canvas ref={canvasRef} className="h-full w-full touch-pan-y" aria-hidden />
      </div>
    </section>
  );
}
