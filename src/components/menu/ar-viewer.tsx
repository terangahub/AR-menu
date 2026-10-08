"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArCubeIcon } from "./ar-cube-icon";

// Fallback 2D non-négociable (section 17.1, 25) : si le modèle 3D échoue,
// on retombe sur l'image.
//
// **Ce repli ne doit se déclencher que sur un échec réel.** Une version
// antérieure basculait aussi au bout d'un simple délai de 25 s, et ce
// faisant démontait le visualiseur, donc **interrompait le
// téléchargement** : un modèle lent devenait "indisponible" pour toujours.
// Le délai ci-dessous ne coupe donc rien : il change seulement le message.
const SLOW_LOAD_MS = 30000;

type Medium = "model" | "photo";

// Détection de AR Quick Look, recopiée de model-viewer
// (`IS_AR_QUICKLOOK_CANDIDATE`, src/constants.ts) plutôt que réinventée :
// sur iOS, les navigateurs tiers listés (Chrome, Edge, Firefox, appli
// Google, DuckDuckGo) savent ouvrir Quick Look, et Safari l'annonce par
// `relList.supports("ar")`. Les navigateurs intégrés aux applications
// (Instagram, Facebook) n'en sont pas capables.
function isQuickLookCandidate(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  if (/CriOS\/|EdgiOS\/|FxiOS\/|GSA\/|DuckDuckGo\//.test(ua)) return true;
  const anchor = document.createElement("a");
  return Boolean(anchor.relList?.supports?.("ar"));
}

// **Le modèle ne se charge plus jamais tout seul.**
//
// Ouvrir la fiche d'un plat dont le modèle pesait 86 Mo et 840 000
// triangles faisait **planter l'onglet Safari** sur iPhone ("A problem
// repeatedly occurred") : une fois décodé et monté sur le GPU, le maillage
// dépasse le budget mémoire que iOS accorde à une page, et le système tue
// le processus avant que le moindre JavaScript puisse réagir. Aucune
// gestion d'erreur ne rattrape cela. Le convive qui scannait le QR code
// tombait sur une page morte, sans même voir le prix ni les allergènes.
//
// La fiche affiche donc d'abord la photo, et le modèle n'est chargé que sur
// un geste explicite. Le module model-viewer lui-même (de l'ordre du
// mégaoctet) n'est importé qu'à ce moment-là, ce qui allège aussi la page
// pour tous ceux qui ne le demandent jamais.
//
// Sur iPhone, la réalité augmentée passe **directement** par Quick Look
// avec le fichier USDZ, exactement comme model-viewer le fait en interne
// (`<a rel="ar">` contenant une image) : Quick Look s'exécute dans un
// processus natif séparé, si bien que l'AR ne charge jamais le GLB dans
// l'onglet et ne peut pas le faire planter.
//
// Ceci est un garde-fou, pas la solution : le vrai correctif est
// d'alléger les modèles (Sprint 9, `S9-02`).
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
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [medium, setMedium] = useState<Medium>("model");
  const [quickLook, setQuickLook] = useState(false);
  // `null` tant que model-viewer n'a pas fini de sonder l'appareil : sans
  // ce troisième état, on annoncerait l'AR indisponible pendant la seconde
  // qui précède sa détection.
  const [arAvailable, setArAvailable] = useState<boolean | null>(null);

  // `navigator` n'existe pas au rendu serveur : la détection attend le
  // montage. Le bouton AR apparaît donc une image plus tard, ce qui est
  // préférable à un rendu serveur qui annoncerait une capacité supposée.
  useEffect(() => {
    setQuickLook(Boolean(usdzUrl) && isQuickLookCandidate());
  }, [usdzUrl]);

  // @google/model-viewer touche `customElements`/`window` : import dynamique
  // côté client uniquement, et seulement une fois le 3D demandé.
  useEffect(() => {
    if (!glbUrl || !active) return;
    import("@google/model-viewer").then(() => setReady(true));
  }, [glbUrl, active]);

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

  // Même mécanique que model-viewer (`openQuickLook`, src/features/ar.ts) :
  // Safari n'honore `rel="ar"` que si le lien contient une image. L'ancre
  // est attachée au document le temps du clic, un lien détaché n'étant pas
  // garanti d'être suivi.
  function launchQuickLook() {
    if (!usdzUrl) return;
    const anchor = document.createElement("a");
    anchor.setAttribute("rel", "ar");
    anchor.setAttribute("href", usdzUrl);
    anchor.style.display = "none";
    anchor.appendChild(document.createElement("img"));
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // L'activation AR alimente le taux d'activation des statistiques
    // (section 10.3). Sans cet appel, tous les convives iPhone passant par
    // Quick Look direct disparaîtraient de cette mesure.
    onArActivated?.();
  }

  // Repli définitif : ni modèle ni AR possible, ou un échec avéré.
  if ((!glbUrl && !quickLook) || failed) {
    return (
      <div className="surface-menu aspect-[4/3] w-full">
        <DishImage imageUrl={imageUrl} alt={alt} />
        {failed && (
          <p className="absolute inset-x-0 bottom-0 bg-background/85 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur">
            {t("arUnavailable")}
          </p>
        )}
      </div>
    );
  }

  // État initial : la photo, et des gestes explicites. Rien n'est chargé.
  if (!active) {
    return (
      <div className="flex flex-col gap-3">
        <div className="surface-menu aspect-[4/3] w-full">
          <DishImage imageUrl={imageUrl} alt={alt} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {quickLook && (
            <button
              type="button"
              onClick={launchQuickLook}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg transition-opacity hover:opacity-90"
            >
              <ArCubeIcon className="h-4 w-4" />
              {t("viewInAr")}
            </button>
          )}
          {glbUrl && (
            <button
              type="button"
              onClick={() => setActive(true)}
              className={
                quickLook
                  ? "rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
                  : "inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg transition-opacity hover:opacity-90"
              }
            >
              {!quickLook && <ArCubeIcon className="h-4 w-4" />}
              {t("view3d")}
            </button>
          )}
        </div>

        {glbUrl && (
          <p className="text-center text-xs text-muted-foreground/80">{t("loadOnDemandHint")}</p>
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
          revient à la photo : le démonter ferait retélécharger le modèle à
          chaque aller-retour entre les deux onglets. */}
      <div
        className={`surface-menu aspect-[4/3] w-full ${showingPhoto ? "hidden" : ""}`}
        aria-hidden={showingPhoto}
      >
        <model-viewer
          ref={ref}
          src={glbUrl ?? undefined}
          ios-src={usdzUrl ?? undefined}
          alt={alt}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          // `eager` : le chargement a été demandé explicitement, inutile
          // d'attendre que model-viewer constate la visibilité du cadre.
          loading="eager"
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
              {/* model-viewer masque son bouton AR quand l'appareil ne peut
                  pas lancer l'AR, ce qui laisse le convive devant une
                  absence inexpliquée. Sur iPhone, cela arrive surtout dans
                  les navigateurs intégrés aux applications (Instagram,
                  Facebook), où ouvrir le menu dans Safari règle le
                  problème : c'est ce que dit le message. */}
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
