"use client";

import { useEffect, useRef } from "react";

// Vidéo qui reste réellement en boucle.
//
// `loop` seul ne suffit pas : l'attribut ne couvre que la fin de lecture,
// pas une mise en pause. Or les navigateurs mettent la vidéo en pause
// d'eux-mêmes dès qu'elle sort de l'écran, quand l'onglet passe en
// arrière-plan, ou en mode économie d'énergie sur iOS - et plus rien ne
// la relance ensuite. C'est ce qui faisait que la vidéo "s'arrêtait
// parfois" sans raison apparente.
//
// Ce composant remet la lecture en marche dès que la vidéo est visible,
// et la met volontairement en pause quand elle ne l'est pas : une vidéo
// qui tourne hors écran sur une page longue consomme de la batterie pour
// rien.
export function LoopingVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let visible = false;

    // `play()` renvoie une promesse qui peut être rejetée (onglet caché,
    // politique d'autoplay). On ignore le rejet : la prochaine tentative
    // fera le travail, et une exception non gérée ici polluerait la
    // console sans rien apporter.
    const tryPlay = () => {
      if (!visible) return;
      const attempt = video.play();
      if (attempt) attempt.catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) tryPlay();
        else video.pause();
      },
      { threshold: 0.1 }
    );
    observer.observe(video);

    // Le navigateur peut mettre en pause de lui-même sans que la vidéo
    // ait quitté l'écran : on rattrape aussi ce cas.
    const onPause = () => tryPlay();
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };

    video.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      video.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      className={className}
    />
  );
}
