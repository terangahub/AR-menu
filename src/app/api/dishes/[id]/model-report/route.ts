import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { inspectGlb } from "@/lib/glb-inspect";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Fenêtre lue au début du fichier. Tout ce que le rapport mesure vit dans
// l'en-tête et le morceau JSON ; 4 Mo laissent une marge confortable même
// pour un descripteur de photogrammétrie, qui déclare beaucoup
// d'accesseurs, tout en gardant la Function loin de sa limite mémoire.
const HEADER_WINDOW_BYTES = 4 * 1024 * 1024;

// GET /api/dishes/[id]/model-report - d'où viennent les mégaoctets d'un
// modèle (ticket S9-01).
//
// La mesure vit ici plutôt que dans un script local pour une raison
// pratique : les modèles sont sur Vercel Blob, et le poste de
// développement de ce projet n'a pas d'accès sortant. La Function, elle,
// atteint le Blob sans difficulté.
//
// Elle ne télécharge surtout pas le fichier entier : faire transiter 94 Mo
// par une Function plafonnée en mémoire et en durée serait précisément le
// risque identifié pour `S9-02`. Seuls les premiers mégaoctets sont lus,
// et le flux est interrompu dès qu'on en a assez.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dish = await prisma.dish.findUnique({
    where: { id },
    select: { restaurantId: true, model3dGlbUrl: true, model3dUsdzUrl: true },
  });
  if (!dish || dish.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }
  if (!dish.model3dGlbUrl) {
    return NextResponse.json({ error: "no_model" }, { status: 404 });
  }

  try {
    const [glb, usdzBytes] = await Promise.all([
      readHead(dish.model3dGlbUrl),
      dish.model3dUsdzUrl ? contentLength(dish.model3dUsdzUrl) : Promise.resolve(null),
    ]);

    return NextResponse.json({ ...inspectGlb(glb), usdzBytes });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "inspect_failed", detail: message }, { status: 502 });
  }
}

// Lit le début du fichier. `Range` est tenté d'abord, mais on ne s'y fie
// pas : si le serveur l'ignore et renvoie tout, on lit le flux jusqu'à
// notre fenêtre puis on l'annule, ce qui coupe le transfert au lieu de
// laisser 94 Mo arriver en mémoire.
async function readHead(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${HEADER_WINDOW_BYTES - 1}` },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`Téléchargement impossible : HTTP ${response.status}`);
  }
  if (!response.body) throw new Error("Réponse sans corps.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < HEADER_WINDOW_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);

  return Buffer.concat(chunks.map((c) => Buffer.from(c)), total);
}

// Le USDZ n'a pas besoin d'être analysé, seulement pesé : c'est un second
// fichier livré au convive iPhone, et son poids compte autant que celui du
// GLB dans l'expérience réelle.
async function contentLength(url: string): Promise<number | null> {
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  const header = response.headers.get("content-length");
  return header ? Number(header) : null;
}
