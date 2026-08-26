import JSZip from "jszip";
import type { ScanJob } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scan3dProvider } from "@/lib/scan3d";
import { uploadModelToBlob } from "@/lib/blob-storage";
import { ACTIVE_SCAN_STATUSES } from "@/lib/scan-status";

// Statut brut KIRI - 4 = Expired (rétention de 3 jours dépassée), pas
// "Exported" comme noté par erreur dans une première version de ce
// chantier. Voir docs/roadmap-ai-instant-3d.md section 0.
export const STATUS_MAP: Record<number, string> = {
  [-1]: "uploading",
  0: "processing",
  1: "failed",
  2: "successful",
  3: "queuing",
  4: "expired",
};

export const ACTIVE_STATUSES = ACTIVE_SCAN_STATUSES;

// Partagé entre le webhook KIRI et le suivi interrogé par le dashboard :
// les deux peuvent apprendre qu'un job a réussi, et il ne doit exister
// qu'une seule façon d'en tirer les fichiers. Ne dépendre que du webhook
// rendrait le résultat inaccessible dès qu'une notification se perd.
export async function finalizeScanJob(scanJob: ScanJob): Promise<ScanJob> {
  if (!scanJob.externalJobId) {
    throw new Error("ScanJob sans identifiant externe");
  }

  try {
    const { modelUrl } = await scan3dProvider.getModelZip(scanJob.externalJobId);
    const zipRes = await fetch(modelUrl);
    if (!zipRes.ok) {
      throw new Error(`Téléchargement du zip échoué (${zipRes.status})`);
    }
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuffer);

    // On scanne pour .glb ET .usdz plutôt que de supposer un seul format
    // présent : c'est ce qui tranche la question ouverte sur fileFormat
    // (un appel donne-t-il les deux formats, ou faut-il en payer deux ?).
    let glbUrl: string | undefined;
    let usdzUrl: string | undefined;

    for (const [filename, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const lower = filename.toLowerCase();
      const extension = lower.endsWith(".glb")
        ? "glb"
        : lower.endsWith(".usdz")
          ? "usdz"
          : null;
      if (!extension) continue;

      const buffer = await entry.async("nodebuffer");
      const result = await uploadModelToBlob(buffer, {
        pathname: `vorae/${scanJob.dishId}/models/${scanJob.dishId}-${scanJob.id}.${extension}`,
        extension,
      });
      if (extension === "glb") glbUrl = result.url;
      else usdzUrl = result.url;
    }

    if (!glbUrl && !usdzUrl) {
      throw new Error(
        `Aucun fichier .glb ou .usdz dans le zip (contenu : ${Object.keys(zip.files).join(", ")})`
      );
    }

    const updated = await prisma.scanJob.update({
      where: { id: scanJob.id },
      data: {
        status: "successful",
        resultModelUrl: modelUrl,
        resultGlbUrl: glbUrl,
        resultUsdzUrl: usdzUrl,
        completedAt: new Date(),
      },
    });

    await prisma.dish.update({
      where: { id: scanJob.dishId },
      data: {
        ...(glbUrl ? { model3dGlbUrl: glbUrl } : {}),
        ...(usdzUrl ? { model3dUsdzUrl: usdzUrl } : {}),
        isArReady: true,
      },
    });

    return updated;
  } catch (err) {
    console.error("[scan] échec du traitement du résultat", err);
    // "finalize_failed", pas "failed" : KIRI a bel et bien réussi
    // (rawStatus 2), c'est notre propre traitement du résultat qui a
    // échoué (zip, extraction, téléversement). Rester dans
    // ACTIVE_SCAN_STATUSES pour que le prochain sondage retente, sans
    // dépenser un nouveau crédit KIRI puisqu'aucun scan n'est relancé.
    return prisma.scanJob.update({
      where: { id: scanJob.id },
      data: {
        status: "finalize_failed",
        errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
        completedAt: null,
      },
    });
  }
}

// Applique un statut brut KIRI à un ScanJob, en finalisant si le modèle
// est prêt et qu'il ne l'a pas déjà été.
export async function applyKiriStatus(scanJob: ScanJob, rawStatus: number): Promise<ScanJob> {
  if (rawStatus === 2) {
    if (scanJob.resultGlbUrl || scanJob.resultUsdzUrl) return scanJob;
    return finalizeScanJob(scanJob);
  }

  const mapped = STATUS_MAP[rawStatus] ?? "processing";
  if (mapped === scanJob.status) return scanJob;

  return prisma.scanJob.update({
    where: { id: scanJob.id },
    data: {
      status: mapped,
      completedAt: rawStatus === 1 || rawStatus === 4 ? new Date() : null,
      errorMessage:
        rawStatus === 1
          ? "Échec de génération côté KIRI"
          : rawStatus === 4
            ? "Modèle expiré (rétention de 3 jours dépassée)"
            : undefined,
    },
  });
}
