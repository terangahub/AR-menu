"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Fallback 2D non-négociable (section 17.1, 25) : si le modèle 3D ne se
// charge pas sous 3s, ou échoue, on retombe immédiatement sur l'image.
const LOAD_TIMEOUT_MS = 3000;

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
      <div className="relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-muted-foreground">{alt}</span>
        )}
        {glbUrl && (
          <p className="absolute bottom-2 text-xs text-muted-foreground">
            {t("arUnavailable")}
          </p>
        )}
      </div>
    );
  }

  if (!ready) {
    return <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="flex flex-col gap-2">
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
        style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "0.5rem" }}
      />
      <p className="text-center text-xs text-muted-foreground">
        {t("rotateHint")}
      </p>
    </div>
  );
}
