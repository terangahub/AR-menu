"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Step = "idle" | "signing" | "uploading" | "starting" | "done" | "error";

// Panneau de capture 3D (Sprint 4.7). La vidéo part directement du
// navigateur vers Cloudinary : elle ne traverse jamais une Vercel
// Function, dont la limite de payload (~4,5 Mo) est bien en-deçà du poids
// d'une vidéo de scan. Voir CONTEXT.md section 5.
export function DishScan({ dishId }: { dishId: string }) {
  const t = useTranslations("Dashboard.dishScan");
  const router = useRouter();
  const videoInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

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
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
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
    setProgress(0);

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

  const busy = step === "signing" || step === "uploading" || step === "starting";
  const label =
    step === "signing"
      ? t("signing")
      : step === "uploading"
        ? t("uploading", { progress })
        : step === "starting"
          ? t("starting")
          : t("submit");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <span className="text-sm font-medium">{t("title")}</span>
      <p className="text-xs text-muted-foreground">{t("help")}</p>
      <input ref={videoInput} type="file" accept="video/*" disabled={busy} />
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={startScan} className="w-fit">
        {label}
      </Button>
      {message && (
        <p className={`text-sm ${step === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
