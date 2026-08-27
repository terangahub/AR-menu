"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Fallback 2D non-négociable (section 17.1, 25) : si le modèle 3D échoue,
// on retombe sur l'image.
//
// Le délai était de 3 s, ce qui rendait le fallback systématique dès le
// premier vrai modèle : aucun maillage de photogrammétrie ne se charge en
// 3 s sur un téléphone en 4G, et le convive voyait toujours la photo avec
// un message annonçant à tort que son appareil ne gère pas l'AR. Le
// convive n'attend pas devant un écran vide pour autant : `poster`
// affiche la photo du plat pendant tout le chargement, et le modèle la
// remplace dès qu'il est prêt. Ce délai n'est donc plus un seuil de
// confort mais un filet contre un modèle qui ne se chargerait jamais.
const LOAD_TIMEOUT_MS = 25000;

export function ArViewer({
  glbUrl,
  usdzUrl,
  imageUrl,
  alt,
  onArActivated,
}: {
  glbUrl?: string | null;
  usdzUrl?: string | null;
  imageUrl?: string | null;
  alt: string;
  onArActivated?: () => void;
}) {
  const t = useTranslations("Dish");
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    glbUrl ? "loading" : "fallback"
  );

  // @google/model-viewer touche `customElements`/`window` - import
  // dynamique côté client uniquement, jamais pendant le rendu serveur.
  useEffect(() => {
    if (!glbUrl) return;
    import("@google/model-viewer").then(() => setReady(true));
  }, [glbUrl]);

  useEffect(() => {
    if (!glbUrl || !ready) return;

    const el = ref.current;
    if (!el) return;

    const handleLoad = () => setStatus("ready");
    const handleError = () => setStatus("fallback");
    const handleArStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string }>).detail;
      if (detail?.status === "session-started") onArActivated?.();
    };

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);
    el.addEventListener("ar-status", handleArStatus);

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "loading" ? "fallback" : current));
    }, LOAD_TIMEOUT_MS);

    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
      el.removeEventListener("ar-status", handleArStatus);
      clearTimeout(timeout);
    };
  }, [glbUrl, ready, onArActivated]);

  if (status === "fallback" || !glbUrl) {
    return (
      <div className="surface-menu aspect-[4/3] w-full">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/40 to-primary/15">
            <span className="font-heading text-6xl text-foreground/25">
              {alt.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {glbUrl && (
          <p className="absolute inset-x-0 bottom-0 bg-background/85 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur">
            {t("arUnavailable")}
          </p>
        )}
      </div>
    );
  }

  if (!ready) {
    return <div className="aspect-[4/3] w-full animate-pulse rounded-card bg-muted" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Fond neutre et discret derrière le modèle : une photogrammétrie
          de plat est déjà très colorée, un cadre chargé la desservirait.
          Le ratio 4:3 est celui des cartes du menu, pour que le passage de
          la liste à la fiche ne provoque pas de saut visuel. */}
      <div className="surface-menu aspect-[4/3] w-full bg-gradient-to-b from-muted/60 to-background hover:translate-y-0 hover:shadow-none">
        <model-viewer
          ref={ref}
          src={glbUrl}
          ios-src={usdzUrl ?? undefined}
          alt={alt}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          poster={imageUrl ?? undefined}
          shadow-intensity="1"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">{t("rotateHint")}</p>
    </div>
  );
}
