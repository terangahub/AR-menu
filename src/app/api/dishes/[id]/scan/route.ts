import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { scan3dProvider, KiriApiError, ScanAlgorithm, ScanFileFormat } from "@/lib/scan3d";
import { kiriReadyVideoUrl } from "@/lib/scan-video";
import { ACTIVE_STATUSES, applyKiriStatus } from "@/lib/scan-finalize";

// GET /api/dishes/[id]/scan - état du dernier scan du plat. Interroge
// KIRI plutôt que de se contenter de ce que la base contient : le
// webhook peut ne jamais arriver (notification perdue, callback mal
// configuré), et le restaurateur resterait alors devant un job
// éternellement « en cours » alors que son modèle est prêt.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish || dish.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }

  let scanJob = await prisma.scanJob.findFirst({
    where: { dishId: id },
    orderBy: { createdAt: "desc" },
  });
  if (!scanJob) {
    return NextResponse.json({ scanJob: null });
  }

  if (scanJob.externalJobId && ACTIVE_STATUSES.includes(scanJob.status)) {
    try {
      const { rawStatus } = await scan3dProvider.getStatus(scanJob.externalJobId);
      scanJob = await applyKiriStatus(scanJob, rawStatus);
    } catch (err) {
      // Un fournisseur injoignable ne doit pas casser l'affichage : le
      // dernier état connu reste préférable à une page en erreur.
      console.error("[scan status] interrogation KIRI échouée", err);
    }
  }

  return NextResponse.json({
    scanJob: {
      id: scanJob.id,
      status: scanJob.status,
      externalJobId: scanJob.externalJobId,
      errorMessage: scanJob.errorMessage,
      glbUrl: scanJob.resultGlbUrl,
      usdzUrl: scanJob.resultUsdzUrl,
      createdAt: scanJob.createdAt,
      completedAt: scanJob.completedAt,
    },
  });
}

// Limites larges plutôt que strictes : la vraie validation (durée vidéo
// 3 min max, 1920x1080, 20 à 300 photos) doit vivre côté dashboard
// (S47-07), avant l'upload, pour ne jamais gaspiller un crédit KIRI sur
// une requête vouée à échouer (codes 2004/2005/2007/2009/2010, voir
// docs/roadmap-ai-instant-3d.md). Cette route reste la ligne de défense
// suivante, pas la première.
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MIN_IMAGES = 20;
const MAX_IMAGES = 300;

// La route telecharge la video depuis Cloudinary puis la reverse a KIRI :
// deux transferts de plusieurs dizaines de Mo. Le plafond par defaut d'une
// Vercel Function (10 s) est trop court pour cela, d'ou ce relevement.
export const maxDuration = 60;

const ALGORITHMS: ScanAlgorithm[] = ["photo", "featureless", "3dgs"];
const FORMATS: ScanFileFormat[] = ["glb", "usdz", "obj", "fbx", "stl", "ply", "gltf", "xyz"];

async function fetchAsFile(url: string, maxSizeBytes: number) {
  let res = await fetch(url);
  // Filet de sécurité seulement : c'est le navigateur qui attend que la
  // transformation soit calculée (Cloudinary répond 423 en attendant),
  // parce qu'un transcodage vidéo depasse souvent le plafond de 60 s
  // d'une Function. Arrivé ici, le fichier dérivé est normalement prêt.
  for (let attempt = 0; attempt < 3 && res.status === 423; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    res = await fetch(url);
  }
  if (res.status === 423) {
    throw new Error(
      "La vidéo est encore en cours de préparation, réessayez dans un instant"
    );
  }
  if (!res.ok) {
    throw new Error(`Téléchargement du média échoué (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > maxSizeBytes) {
    throw new Error("Média trop volumineux");
  }
  const filename = new URL(url).pathname.split("/").pop() || "media";
  return { buffer, filename };
}

// POST /api/dishes/[id]/scan - déclenche une capture 3D automatisée via
// KIRI Engine (Sprint 4.7). Reçoit un JSON { videoUrl } ou
// { imageUrls: string[] }, jamais le fichier lui-même : les Vercel
// Functions refusent tout corps de requête au-delà d'environ 4,5 Mo
// (FUNCTION_PAYLOAD_TOO_LARGE), bien en-deçà de ce que pèse une vidéo de
// scan utilisable. Le média doit d'abord être téléversé directement chez
// Cloudinary via POST /api/dishes/[id]/scan/upload-url, qui ne fait
// jamais transiter les octets par notre Function. Voir CONTEXT.md
// section 5.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish || dish.restaurantId !== restaurantUser.restaurantId) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const algorithm: ScanAlgorithm = ALGORITHMS.includes(body.algorithm)
    ? body.algorithm
    : "featureless";
  const fileFormat: ScanFileFormat = FORMATS.includes(body.format) ? body.format : "glb";

  const videoUrl: string | undefined = typeof body.videoUrl === "string" ? body.videoUrl : undefined;
  const imageUrls: string[] | undefined = Array.isArray(body.imageUrls) ? body.imageUrls : undefined;

  let mediaType: "video" | "image";
  let video: { buffer: Buffer; filename: string } | undefined;
  let images: { buffer: Buffer; filename: string }[] | undefined;

  try {
    if (videoUrl) {
      mediaType = "video";
      video = await fetchAsFile(kiriReadyVideoUrl(videoUrl), MAX_VIDEO_SIZE_BYTES);
    } else if (imageUrls?.length) {
      if (imageUrls.length < MIN_IMAGES || imageUrls.length > MAX_IMAGES) {
        return NextResponse.json(
          { error: `Entre ${MIN_IMAGES} et ${MAX_IMAGES} photos sont requises` },
          { status: 400 }
        );
      }
      mediaType = "image";
      images = await Promise.all(imageUrls.map((url) => fetchAsFile(url, MAX_IMAGE_SIZE_BYTES)));
    } else {
      return NextResponse.json({ error: "Missing videoUrl or imageUrls" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Échec de récupération du média" },
      { status: 400 }
    );
  }

  // Créé avant l'appel KIRI pour tracer même un échec au démarrage
  // (crédit insuffisant, clé invalide) - jamais d'appel fournisseur sans
  // ligne correspondante dans ScanJob.
  let scanJob;
  try {
    scanJob = await prisma.scanJob.create({
      data: {
        dishId: id,
        provider: "kiri",
        algorithm,
        status: "uploading",
        sourceMediaType: mediaType,
        sourceMediaUrl: videoUrl ?? imageUrls?.[0],
        requestedFormat: fileFormat,
      },
    });
  } catch (err) {
    // Sans ce message, une table ou une colonne absente en base donne un
    // 500 au corps vide, indiagnosticable depuis le navigateur.
    return NextResponse.json(
      {
        error: `Creation du ScanJob impossible : ${
          err instanceof Error ? err.message : "erreur inconnue"
        }`,
      },
      { status: 500 }
    );
  }

  try {
    const { externalJobId } = await scan3dProvider.startScan({
      algorithm,
      mediaType,
      fileFormat,
      video,
      images,
      isMask: true,
    });

    const updated = await prisma.scanJob.update({
      where: { id: scanJob.id },
      data: { externalJobId, status: "processing", creditsUsed: 1 },
    });

    return NextResponse.json({
      scanJobId: updated.id,
      externalJobId: updated.externalJobId,
      status: updated.status,
    });
  } catch (err) {
    const kiriError = err instanceof KiriApiError ? err : null;
    await prisma.scanJob.update({
      where: { id: scanJob.id },
      data: {
        status: "failed",
        errorCode: kiriError?.kiriCode,
        errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
      },
    });

    // 403 côté KIRI = crédit insuffisant (pas 401) - distingué explicitement
    // pour que le dashboard puisse proposer une recharge plutôt qu'afficher
    // une erreur générique.
    if (kiriError?.httpStatus === 403) {
      return NextResponse.json(
        { error: "Solde de crédits KIRI insuffisant" },
        { status: 402 }
      );
    }
    if (kiriError?.httpStatus === 401) {
      return NextResponse.json(
        { error: "Clé API KIRI invalide ou absente" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: "Le scan n'a pas pu démarrer",
        detail: err instanceof Error ? err.message : "erreur inconnue",
      },
      { status: 502 }
    );
  }
}
