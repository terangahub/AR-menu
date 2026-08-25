import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { scan3dProvider } from "@/lib/scan3d";
import { uploadBuffer } from "@/lib/cloudinary";

// Statut brut KIRI - 4 = Expired (rétention de 3 jours dépassée), pas
// "Exported" comme noté par erreur dans une première version de ce
// chantier. Voir docs/roadmap-ai-instant-3d.md section 0.
const STATUS_MAP: Record<number, string> = {
  [-1]: "uploading",
  0: "processing",
  1: "failed",
  2: "successful",
  3: "queuing",
  4: "expired",
};

// POST /api/webhooks/kiri - callback unique pour tous les ScanJob du
// compte (configuré manuellement dans Settings > Webhooks du dashboard
// KIRI, cf. S47-05bis, URL de production :
// https://vorae-menu.vercel.app/api/webhooks/kiri). Le champ `serialize`
// du corps identifie le ScanJob concerné, pas l'URL elle-même - un seul
// webhook reçoit les événements de tous les plats de tous les
// restaurants.
//
// Validation de signature volontairement absente pour l'instant : la doc
// KIRI mentionne un secret de signature (KIRI_WEBHOOK_SECRET une fois
// configuré) mais ne précise ni l'en-tête ni l'algorithme utilisé.
// Plutôt que de deviner un mécanisme qui donnerait une fausse impression
// de sécurité, on journalise les en-têtes reçus pour déterminer le vrai
// mécanisme au premier appel réel, puis on l'implémente.
export async function POST(req: NextRequest) {
  const headersSnapshot = Object.fromEntries(req.headers.entries());
  const body = await req.json().catch(() => null);

  console.log("[webhook kiri] en-têtes reçus", headersSnapshot);
  console.log("[webhook kiri] corps reçu", body);

  if (!body || typeof body.serialize !== "string" || typeof body.status !== "number") {
    // Répondre 200 quand même : KIRI attend ce code pour considérer la
    // notification livrée, la doc ne précise pas de comportement de
    // retry sur un format qu'on ne saura de toute façon jamais traiter.
    return NextResponse.json({ ok: false, reason: "malformed body"}, { status: 200 });
  }

  const { serialize, status } = body as { serialize: string; status: number };

  const scanJob = await prisma.scanJob.findFirst({ where: { externalJobId: serialize } });
  if (!scanJob) {
    console.warn(`[webhook kiri] aucun ScanJob pour serialize=${serialize}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const mappedStatus = STATUS_MAP[status] ?? "processing";

  if (status !== 2) {
    await prisma.scanJob.update({
      where: { id: scanJob.id },
      data: {
        status: mappedStatus,
        completedAt: status === 1 || status === 4 ? new Date() : null,
        errorMessage:
          status === 1
            ? "Échec de génération côté KIRI"
            : status === 4
              ? "Modèle expiré (rétention de 3 jours dépassée)"
              : undefined,
      },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Statut 2 = Successful : récupérer le zip et téléverser ce qu'il
  // contient. On scanne pour .glb ET .usdz plutôt que de supposer un
  // seul format présent - ça tranche directement la question ouverte
  // sur fileFormat (un appel donne-t-il les deux formats ou un seul ?).
  try {
    const { modelUrl } = await scan3dProvider.getModelZip(serialize);
    const zipRes = await fetch(modelUrl);
    if (!zipRes.ok) {
      throw new Error(`Téléchargement du zip échoué (${zipRes.status})`);
    }
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuffer);

    let glbUrl: string | undefined;
    let usdzUrl: string | undefined;

    for (const [filename, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const lower = filename.toLowerCase();
      if (lower.endsWith(".glb")) {
        const buffer = await entry.async("nodebuffer");
        const result = await uploadBuffer(buffer, {
          folder: `vorae/${scanJob.dishId}/models`,
          resourceType: "raw",
          publicId: `${scanJob.dishId}-${scanJob.id}.glb`,
        });
        glbUrl = result.secure_url;
      } else if (lower.endsWith(".usdz")) {
        const buffer = await entry.async("nodebuffer");
        const result = await uploadBuffer(buffer, {
          folder: `vorae/${scanJob.dishId}/models`,
          resourceType: "raw",
          publicId: `${scanJob.dishId}-${scanJob.id}.usdz`,
        });
        usdzUrl = result.secure_url;
      }
    }

    if (!glbUrl && !usdzUrl) {
      throw new Error(
        `Aucun fichier .glb ou .usdz dans le zip (contenu : ${Object.keys(zip.files).join(", ")})`
      );
    }

    await prisma.scanJob.update({
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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[webhook kiri] échec du traitement du résultat", err);
    await prisma.scanJob.update({
      where: { id: scanJob.id },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
        completedAt: new Date(),
      },
    });
    // 200 quand même : l'échec est de notre côté (Cloudinary, réseau),
    // pas quelque chose que KIRI doit renvoyer différemment.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
