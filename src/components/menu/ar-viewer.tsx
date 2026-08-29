"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArCubeIcon } from "./ar-cube-icon";

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

// Cadrage initial du modèle dans la page.
//
// Le défaut de model-viewer est `0deg 75deg 105%`, où le pourcentage est un
// multiple de la distance qui fait tout juste tenir le modèle dans le
// cadre : à 105 %, l'objet remplit l'écran et on ne voit plus ce qu'on
// regarde. À 170 %, il occupe environ 60 % de la hauteur, avec de l'air
// autour, ce qui permet de reconnaître le plat avant de lancer l'AR.
//
// `min`/`max-camera-orbit` bornent ensuite le zoom manuel : sans borne
// basse, un doigt maladroit envoie la caméra à l'intérieur du maillage, et
// le convive se retrouve devant un écran uni sans comprendre pourquoi.
// `auto` conserve le comportement par défaut sur les deux angles.
const INITIAL_ORBIT = "0deg 75deg 170%";
const MIN_ORBIT = "auto auto 90%";
const MAX_ORBIT = "auto auto 400%";

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
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    glbUrl ? "loading" : "fallback"
  );
  const [medium, setMedium] = useState<Medium>("model");

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

  // La bascule n'a de sens que si les deux médias existent : sans photo,
  // proposer un onglet Photo vide serait une fausse promesse.
  const canSwitch = Boolean(imageUrl);
  const showingPhoto = canSwitch && medium === "photo";

  return (
    <div className="flex flex-col gap-3">
      {/* Fond neutre et discret derrière le modèle : une photogrammétrie
          de plat est déjà très colorée, un cadre chargé la desservirait.
          Le ratio 4:3 est celui des cartes du menu, pour que le passage de
          la liste à la fiche ne provoque pas de saut visuel.

          Le visualiseur est masqué en CSS et non démonté quand le convive
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
          camera-orbit={INITIAL_ORBIT}
          min-camera-orbit={MIN_ORBIT}
          max-camera-orbit={MAX_ORBIT}
          poster={imageUrl ?? undefined}
          shadow-intensity="1"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          {/* Bouton d'activation maison plutôt que celui de model-viewer :
              le bouton par défaut est un rectangle blanc générique posé en
              bas à droite, sans rapport avec le reste du menu. Le slot
              `ar-button` est masqué automatiquement par model-viewer quand
              l'appareil ne peut pas activer l'AR, donc aucun bouton mort
              n'apparaît sur un ordinateur de bureau. */}
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

      {/* La photo du plat est l'image qui donne faim, et c'est elle que le
          restaurateur a fait faire. Le modèle 3D la remplaçait purement et
          simplement : un convive qui voulait revoir la photo devait
          revenir en arrière. Les deux médias sont désormais à un geste
          l'un de l'autre, le modèle en premier puisque c'est ce que le
          convive est venu chercher en touchant une carte marquée du cube. */}
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
        <p className="text-center text-xs text-muted-foreground">{t("rotateHint")}</p>
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
