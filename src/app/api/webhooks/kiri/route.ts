import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyKiriStatus } from "@/lib/scan-finalize";

// POST /api/webhooks/kiri - callback unique pour tous les ScanJob du
// compte (configuré manuellement dans Settings > Webhooks du dashboard
// KIRI, cf. S7-09, URL de production :
// https://vorae-menu.vercel.app/api/webhooks/kiri). Le champ `serialize`
// du corps identifie le ScanJob concerné, pas l'URL elle-même - un seul
// webhook reçoit les événements de tous les plats de tous les
// restaurants.
//
// Le traitement du résultat vit dans lib/scan-finalize.ts, partagé avec
// le suivi interrogé par le dashboard : une notification peut se perdre,
// et le modèle doit rester récupérable sans elle.
//
// Validation de signature volontairement absente pour l'instant : la doc
// KIRI mentionne un secret de signature (KIRI_WEBHOOK_SECRET une fois
// configuré) mais ne précise ni l'en-tête ni l'algorithme utilisé.
// Plutôt que de deviner un mécanisme qui donnerait une fausse impression
// de sécurité, on journalise les en-têtes reçus pour déterminer le vrai
// mécanisme au premier appel réel, puis on l'implémente.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const headersSnapshot = Object.fromEntries(req.headers.entries());
  const body = await req.json().catch(() => null);

  console.log("[webhook kiri] en-têtes reçus", headersSnapshot);
  console.log("[webhook kiri] corps reçu", body);

  if (!body || typeof body.serialize !== "string" || typeof body.status !== "number") {
    // Répondre 200 quand même : KIRI attend ce code pour considérer la
    // notification livrée, la doc ne précise pas de comportement de
    // retry sur un format qu'on ne saura de toute façon jamais traiter.
    return NextResponse.json({ ok: false, reason: "malformed body" }, { status: 200 });
  }

  const { serialize, status } = body as { serialize: string; status: number };

  const scanJob = await prisma.scanJob.findFirst({ where: { externalJobId: serialize } });
  if (!scanJob) {
    console.warn(`[webhook kiri] aucun ScanJob pour serialize=${serialize}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const updated = await applyKiriStatus(scanJob, status);

  // 200 même en cas d'échec de notre côté (Cloudinary, réseau) : ce n'est
  // pas quelque chose que KIRI doit renvoyer différemment.
  return NextResponse.json({ ok: updated.status !== "failed" }, { status: 200 });
}
