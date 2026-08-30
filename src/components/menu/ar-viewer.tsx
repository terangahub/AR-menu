"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArCubeIcon } from "./ar-cube-icon";

// Fallback 2D non-négociable (section 17.1, 25) : si le modèle 3D échoue,
// on retombe sur l'image.
//
// **Ce repli ne doit se déclencher que sur un échec réel.** La version
// précédente basculait aussi au bout d'un simple délai de 25 s, et ce
// faisant démontait le visualiseur, donc **interrompait le
// téléchargement** : un modèle qui serait arrivé à la quarantième seconde
// était déclaré indisponible pour toujours, et le convive lisait
// "Modèle 3D indisponible" alors que rien n'avait échoué. Sur des fichiers
// de l'ordre de 90 Mo (voir Sprint 9), c'était le cas courant en 4G.
//
// Le délai ci-dessous ne coupe donc plus rien : il change seulement le
// message, pour dire que c'est long sans prétendre que c'est cassé.
const SLOW_LOAD_MS = 30000;

type Medium = "model" | "photo";

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
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [medium, setMedium] = useState<Medium>("model");
  // `null` tant que model-viewer n'a pas fini de sonder l'appareil : sans
  // ce troisième état, on annoncerait l'AR indisponible pendant la seconde
  // qui précède sa détection.
  const [arAvailable, setArAvailable] = useState<boolean | null>(null);

  // @google/model-viewer touche `customElements`/`window` - import
  // dynamique côté client uniquement, jamais pendant le rendu serveur.
  useEffect(() => {
    if (!glbUrl) return;
    import("@google/model-viewer").then(() => setReady(true));
  }, [glbUrl]);

  const readArSupport = useCallback(() => {
    const el = ref.current as (HTMLElement & { canActivateAR?: boolean }) | null;
    if (el) setArAvailable(Boolean(el.canActivateAR));
  }, []);

  useEffect(() => {
    if (!glbUrl || !ready) return;

    const el = ref.current;
    if (!el) return;

    const handleLoad = () => {
      setLoaded(true);
      setProgress(1);
      readArSupport();
    };
    const handleError = () => setFailed(true);
    // `totalProgress` va de 0 à 1. L'afficher évite l'attente aveugle :
    // devant un écran figé, un convive conclut à une panne au bout de
    // quelques secondes, alors qu'un compteur qui monte se supporte.
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress: number }>).detail;
      if (typeof detail?.totalProgress === "number") setProgress(detail.totalProgress);
    };
    const handleArStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string }>).detail;
      if (detail?.status === "session-started") onArActivated?.();
    };

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);
    el.addEventListener("progress", handleProgress);
    el.addEventListener("ar-status", handleArStatus);

    const timeout = setTimeout(() => setSlow(true), SLOW_LOAD_MS);

    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
      el.removeEventListener("progress", handleProgress);
      el.removeEventListener("ar-status", handleArStatus);
      clearTimeout(timeout);
    };
  }, [glbUrl, ready, onArActivated, readArSupport]);

  // Repli définitif : pas de modèle, ou un échec avéré.
  if (!glbUrl || failed) {
    return (
      <div className="surface-menu aspect-[4/3] w-full">
        <DishImage imageUrl={imageUrl} alt={alt} />
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

  const canSwitch = Boolean(imageUrl);
  const showingPhoto = canSwitch && medium === "photo";
  const percent = Math.round(progress * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Le visualiseur est masqué en CSS et non démonté quand le convive
          revient à la photo : un modèle issu de photogrammétrie pèse
          plusieurs dizaines de mégaoctets, le démonter le ferait
          retélécharger à chaque aller-retour entre les deux onglets. */}
      <div
        className={`surface-menu aspect-[4/3] w-full ${showingPhoto ? "hidden" : ""}`}
        aria-hidden={showingPhoto}
      >
        <model-viewer
          ref={ref}
          src={glbUrl}
          ios-src={usdzUrl ?? undefined}
          alt={alt}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          camera-orbit="0deg 75deg 170%"
          min-camera-orbit="auto auto 90%"
          max-camera-orbit="auto auto 400%"
          poster={imageUrl ?? undefined}
          shadow-intensity="1"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          {/* Bouton d'activation maison plutôt que celui de model-viewer :
              le bouton par défaut est un rectangle blanc générique posé en
              bas à droite, sans rapport avec le reste du menu. Le slot
              `ar-button` est masqué automatiquement par model-viewer quand
              l'appareil ne peut pas activer l'AR. */}
          <button slot="ar-button" type="button" className="ar-launch">
            <ArCubeIcon className="h-4 w-4" />
            {t("viewInAr")}
          </button>
        </model-viewer>
      </div>

      {showingPhoto && (
        <div className="surface-menu aspect-[4/3] w-full">
          <DishImage imageUrl={imageUrl} alt={alt} />
        </div>
      )}

      {canSwitch && (
        <div
          role="group"
          aria-label={t("mediumLabel")}
          className="mx-auto inline-flex items-center rounded-full border border-border p-0.5"
        >
          <MediumButton
            active={medium === "model"}
            onClick={() => setMedium("model")}
            label={t("medium3d")}
          />
          <MediumButton
            active={medium === "photo"}
            onClick={() => setMedium("photo")}
            label={t("mediumPhoto")}
          />
        </div>
      )}

      {!showingPhoto && (
        <div className="flex flex-col items-center gap-1 text-center">
          {!loaded ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t("loadingModel", { percent })}
              </p>
              {slow && (
                <p className="text-xs text-muted-foreground/70">{t("loadingSlow")}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{t("rotateHint")}</p>
              {/* Le bouton d'activation est masqué par model-viewer quand
                  l'appareil ne peut pas lancer l'AR, et le convive se
                  retrouve alors devant une absence qu'il ne s'explique
                  pas : sur iPhone, seul Safari sait ouvrir Quick Look,
                  Chrome n'en est pas capable. Le dire vaut mieux que de ne
                  rien afficher. */}
              {arAvailable === false && (
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground/70">
                  {t("arNotSupported")}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DishImage({ imageUrl, alt }: { imageUrl?: string | null; alt: string }) {
  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-foreground/[0.07] to-foreground/[0.02]">
        <span className="font-heading text-6xl text-foreground/20">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
  );
}

function MediumButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
