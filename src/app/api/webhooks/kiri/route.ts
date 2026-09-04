import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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
// **Authentification par jeton dans l'URL de callback.** La doc KIRI
// mentionne un secret de signature mais ne précise ni l'en-tête ni
// l'algorithme, et deviner un mécanisme donnerait une fausse impression
// de sécurité. Or c'est nous qui choisissons l'URL enregistrée chez eux :
// y placer un jeton que seul KIRI connaîtra protège tout aussi bien, sans
// rien supposer de leur implémentation. À enregistrer sous la forme
// `.../api/webhooks/kiri?token=<KIRI_WEBHOOK_SECRET>`.
//
// Refus strict quand le jeton manque ou ne correspond pas, y compris si le
// secret n'est pas configuré : un webhook ouvert laisserait n'importe qui
// déclarer un scan réussi ou échoué.
//
// **Correction d'une affirmation fausse qui vivait ici** : ce commentaire
// disait que le webhook n'était plus indispensable puisque le suivi
// interroge KIRI directement (`S7-08`). C'est faux, et l'erreur a coûté un
// scan. Ce suivi est **piloté par le navigateur** : il ne tourne que tant
// que le restaurateur garde la fiche du plat ouverte. Une reconstruction
// prend plusieurs minutes, il referme donc souvent l'onglet avant la fin,
// et plus rien ne finalise le job. Le webhook est la seule voie qui
// fonctionne quand personne ne regarde. Tant que `KIRI_WEBHOOK_SECRET`
// n'est pas renseigné, cette route refuse tout, et un scan payé peut
// rester sans modèle (voir `S9-11`).
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.KIRI_WEBHOOK_SECRET;
  if (!expected) return false;
  const provided = new URL(req.url).searchParams.get("token");
  if (!provided) return false;

  // Comparaison à durée constante : une comparaison ordinaire s'arrête au
  // premier caractère différent, ce qui laisse deviner le secret caractère
  // par caractère en mesurant le temps de réponse.
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length) return false;
  return timingSafeEqual(expectedBytes, providedBytes);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    console.warn("[webhook kiri] appel refusé : jeton absent ou invalide");
    // 401 et non 200 : ce n'est pas une notification mal formée de KIRI
    // mais un appel non authentifié, qu'il faut voir dans les journaux.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headersSnapshot = Object.fromEntries(req.headers.entries());
  const body = await req.json().catch(() => null);

  // Toujours journalisés : le jour où KIRI documentera sa signature, ces
  // en-têtes diront quel mécanisme adopter pour remplacer le jeton d'URL.
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
