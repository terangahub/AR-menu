"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

import { kiriReadyVideoUrl } from "@/lib/scan-video";

type Step = "idle" | "signing" | "uploading" | "preparing" | "starting" | "done" | "error";

// Cloudinary répond 423 tant qu'une transformation vidéo inédite n'est
// pas calculée. L'attente vit ici plutôt que dans la route : une Function
// Vercel est plafonnée à 60 s, ce qu'un transcodage dépasse souvent, alors
// que le navigateur peut patienter sans limite.
const PREPARE_TIMEOUT_MS = 5 * 60 * 1000;
const PREPARE_POLL_MS = 4000;

// Durée typique observée d'un transcodage, sur laquelle la barre progresse
// pendant la préparation. Ce n'est qu'une estimation : la barre plafonne
// et n'atteint jamais la fin de cette phase tant que Cloudinary n'a pas
// répondu, plutôt que d'afficher un « terminé » mensonger.
const PREPARE_ESTIMATE_MS = 90 * 1000;

// Chaque étape occupe une part de la barre globale. L'envoi pèse le plus
// lourd parce que c'est la seule dont la progression est réelle, mesurée
// octet par octet.
const PHASE_START: Record<Step, number> = {
  idle: 0,
  signing: 0,
  uploading: 8,
  preparing: 62,
  starting: 92,
  done: 100,
  error: 0,
};
const PHASE_END: Record<Step, number> = {
  idle: 0,
  signing: 8,
  uploading: 62,
  preparing: 92,
  starting: 99,
  done: 100,
  error: 0,
};

type ScanJobState = {
  id: string;
  status: string;
  externalJobId: string | null;
  errorMessage: string | null;
  glbUrl: string | null;
  usdzUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

type ScanQuota = {
  limit: number;
  used: number;
  remaining: number;
};

// La génération chez KIRI dure plusieurs minutes : un intervalle court
// n'apporterait rien d'autre que du trafic inutile.
const JOB_POLL_MS = 15000;
const ACTIVE_JOB_STATUSES = ["uploading", "processing", "queuing"];

async function waitForDerivedVideo(url: string) {
  const deadline = Date.now() + PREPARE_TIMEOUT_MS;
  for (;;) {
    // HEAD plutôt que GET : inutile de retélécharger la vidéo entière à
    // chaque tentative, a fortiori sur un forfait mobile.
    const res = await fetch(url, { method: "HEAD" });
    if (res.status !== 423) return;
    if (Date.now() > deadline) {
      throw new Error("La préparation de la vidéo a pris trop de temps");
    }
    await new Promise((resolve) => setTimeout(resolve, PREPARE_POLL_MS));
  }
}

// Panneau de capture 3D (Sprint 7). La vidéo part directement du
// navigateur vers Cloudinary : elle ne traverse jamais une Vercel
// Function, dont la limite de payload (~4,5 Mo) est bien en-deçà du poids
// d'une vidéo de scan. Voir CONTEXT.md section 5.
export function DishScan({ dishId }: { dishId: string }) {
  const t = useTranslations("Dashboard.dishScan");
  const router = useRouter();
  const videoInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [prepareStartedAt, setPrepareStartedAt] = useState<number | null>(null);
  const [prepareElapsed, setPrepareElapsed] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [job, setJob] = useState<ScanJobState | null>(null);
  // Doublé par une référence : le minuteur doit lire l'état courant sans
  // se réabonner à chaque changement, et sans effet de bord dans un
  // calculateur d'état.
  const jobRef = useRef<ScanJobState | null>(null);
  const [quota, setQuota] = useState<ScanQuota | null>(null);
  const [rawStatus, setRawStatus] = useState<number | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const busy =
    step === "signing" || step === "uploading" || step === "preparing" || step === "starting";

  // Sans cet avertissement, un restaurateur qui ferme l'onglet pendant la
  // préparation perd sa vidéo sans jamais comprendre pourquoi : le scan
  // n'a pas encore été lancé côté KIRI à ce stade.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // État du scan en cours, rafraîchi tant qu'il n'est pas terminé. Le
  // suivi ne s'arrête jamais sur un job actif : sans lui, la page ne
  // dirait plus rien entre le lancement et l'arrivée du modèle.
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch(`/api/dishes/${dishId}/scan`);
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        setQuota(body.quota ?? null);
        setRawStatus(typeof body.rawStatus === "number" ? body.rawStatus : null);
        setProviderError(body.providerError ?? null);
        setLastCheckedAt(Date.now());
        const next: ScanJobState | null = body.scanJob;
        const previous = jobRef.current;
        jobRef.current = next;
        setJob(next);
        // Le modèle vient d'arriver : la fiche du plat doit se recharger
        // pour l'afficher.
        if (previous && next && previous.status !== next.status && next.glbUrl) {
          router.refresh();
        }
      } catch {
        // Réseau instable : on retentera au prochain tour.
      }
    }

    void refresh();
    const timer = setInterval(() => {
      const current = jobRef.current;
      if (current && !ACTIVE_JOB_STATUSES.includes(current.status)) return;
      void refresh();
    }, JOB_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [dishId, router]);

  // La préparation est la seule étape sans progression mesurable : le
  // temps écoulé sert de repère, faute de mieux.
  useEffect(() => {
    if (step !== "preparing" || prepareStartedAt === null) return;
    const timer = setInterval(() => setPrepareElapsed(Date.now() - prepareStartedAt), 500);
    return () => clearInterval(timer);
  }, [step, prepareStartedAt]);

  function uploadToCloudinary(
    signed: {
      uploadUrl: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      publicId: string;
      signature: string;
    },
    file: File
  ) {
    return new Promise<string>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("timestamp", String(signed.timestamp));
      form.append("folder", signed.folder);
      form.append("public_id", signed.publicId);
      form.append("signature", signed.signature);

      // XHR plutôt que fetch : c'est la seule façon d'avoir une barre de
      // progression sur un upload, et une vidéo de scan prend du temps.
      const xhr = new XMLHttpRequest();
      xhr.open("POST", signed.uploadUrl);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPercent(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`));
          return;
        }
        const url = JSON.parse(xhr.responseText).secure_url;
        if (!url) reject(new Error("Cloudinary n'a pas renvoyé de secure_url"));
        else resolve(url);
      };
      xhr.onerror = () => reject(new Error("Upload Cloudinary interrompu"));
      xhr.send(form);
    });
  }

  async function startScan() {
    const file = videoInput.current?.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploadPercent(0);
    setPrepareElapsed(0);
    setPrepareStartedAt(null);

    try {
      setStep("signing");
      const signRes = await fetch(`/api/dishes/${dishId}/scan/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "video" }),
      });
      if (!signRes.ok) {
        throw new Error(`upload-url ${signRes.status}: ${await signRes.text()}`);
      }
      const signed = await signRes.json();

      setStep("uploading");
      const videoUrl = await uploadToCloudinary(signed, file);

      setStep("preparing");
      setPrepareStartedAt(Date.now());
      await waitForDerivedVideo(kiriReadyVideoUrl(videoUrl));

      setStep("starting");
      const scanRes = await fetch(`/api/dishes/${dishId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, algorithm: "featureless", format: "glb" }),
      });
      const scanBody = await scanRes.json().catch(() => null);
      if (!scanRes.ok) {
        // detail porte la cause reelle renvoyee par le fournisseur : sans
        // elle, un echec KIRI se resume a un message generique qui
        // n'oriente vers rien.
        const detail = scanBody?.detail ? ` (${scanBody.detail})` : "";
        throw new Error(`${scanBody?.error ?? `scan ${scanRes.status}`}${detail}`);
      }

      setStep("done");
      setMessage(t("started", { jobId: scanBody.externalJobId ?? scanBody.scanJobId }));
      router.refresh();
    } catch (err) {
      setStep("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  // Progression globale : la part réelle quand elle existe (l'envoi), une
  // estimation plafonnée sinon.
  function overallPercent(): number {
    const from = PHASE_START[step];
    const span = PHASE_END[step] - from;
    if (step === "uploading") return from + (span * uploadPercent) / 100;
    if (step === "preparing") {
      const ratio = Math.min(prepareElapsed / PREPARE_ESTIMATE_MS, 1);
      // Plafonné à 95 % de la phase : la barre ralentit puis s'arrête
      // juste avant la fin tant que la vidéo n'est pas prête.
      return from + span * ratio * 0.95;
    }
    if (step === "done") return 100;
    return from + span / 2;
  }

  const percent = Math.round(overallPercent());
  const stepLabel =
    step === "signing"
      ? t("signing")
      : step === "uploading"
        ? t("uploading")
        : step === "preparing"
          ? t("preparing")
          : t("starting");
  const elapsedSeconds = Math.floor(prepareElapsed / 1000);
  const jobActive = job ? ACTIVE_JOB_STATUSES.includes(job.status) : false;
  const quotaExhausted = quota ? quota.remaining <= 0 : false;
  // Un scan déjà en cours sur ce plat serait refusé côté serveur : autant
  // que le bouton le dise avant le clic.
  const blocked = jobActive || quotaExhausted;
  // Les statuts renvoyés par KIRI se réduisent à trois cas côté
  // restaurateur : ça travaille, c'est prêt, ça a échoué. « expired »
  // rejoint l'échec, la seule action possible étant de rescanner.
  const jobStatusKey = jobActive
    ? "active"
    : job?.status === "successful"
      ? "successful"
      : "failed";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <span className="text-sm font-medium">{t("title")}</span>
      <p className="text-xs text-muted-foreground">{t("help")}</p>
      <input ref={videoInput} type="file" accept="video/*" disabled={busy || blocked} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || blocked}
        onClick={startScan}
        className="w-fit"
      >
        {t("submit")}
      </Button>
      {quota && (
        <p className="text-xs text-muted-foreground">
          {quotaExhausted
            ? t("quotaExhausted", { limit: quota.limit })
            : t("quotaRemaining", { remaining: quota.remaining, limit: quota.limit })}
        </p>
      )}
      {message && (
        <p className={`text-sm ${step === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}

      {job && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${
                jobActive
                  ? "animate-pulse bg-primary"
                  : job.status === "successful"
                    ? "bg-primary"
                    : "bg-destructive"
              }`}
            />
            <span className="text-sm font-medium">{t(`jobStatus.${jobStatusKey}`)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`jobHelp.${jobStatusKey}`)}
          </p>
          {jobActive && (
            <p className="mt-2 text-xs text-muted-foreground">
              {providerError
                ? t("providerUnreachable", { detail: providerError })
                : t("lastChecked", {
                    stage: rawStatus === 3 ? t("stageQueued") : t("stageProcessing"),
                    time: lastCheckedAt
                      ? new Date(lastCheckedAt).toLocaleTimeString()
                      : "-",
                  })}
            </p>
          )}
          {job.errorMessage && (
            <p className="mt-2 text-xs text-destructive">{job.errorMessage}</p>
          )}
          {job.status === "successful" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("jobFormats", {
                formats: [job.glbUrl ? "GLB" : null, job.usdzUrl ? "USDZ" : null]
                  .filter(Boolean)
                  .join(" + "),
              })}
            </p>
          )}
        </div>
      )}

      {busy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-progress-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 id="scan-progress-title" className="text-lg font-semibold">
              {t("modalTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("modalIntro")}</p>

            <div
              className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-foreground">{stepLabel}</span>
              <span className="text-sm tabular-nums text-muted-foreground">{percent}%</span>
            </div>

            {step === "preparing" && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("preparingDetail", { seconds: elapsedSeconds })}
              </p>
            )}

            <p className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {t("modalWarning")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
