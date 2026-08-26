import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { scan3dProvider, KiriApiError, ScanAlgorithm, ScanFileFormat } from "@/lib/scan3d";
import { kiriReadyVideoUrl } from "@/lib/scan-video";
import { ACTIVE_STATUSES, applyKiriStatus } from "@/lib/scan-finalize";
import { CREDITS_PER_SCAN, getScanQuota, hasActiveScanJob } from "@/lib/scan-quota";

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

  const quota = await getScanQuota(restaurantUser.restaurantId);

  // Deux jobs par scan depuis S7-17 (un format chacun), donc les deux
  // plus récents forment exactement le dernier lot. Un plat scanné avant
  // ce changement n'en a qu'un, et la requête le renvoie seul.
  const jobs = await prisma.scanJob.findMany({
    where: { dishId: id },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  if (jobs.length === 0) {
    return NextResponse.json({ scanJob: null, quota });
  }

  // Remontés au client pour distinguer « le fournisseur travaille » de
  // « on n'arrive plus à le joindre » : sans eux, les deux cas donnent le
  // même affichage figé, et un scan bloqué ressemble à un scan lent.
  let rawStatus: number | null = null;
  let providerError: string | null = null;

  // Séquentiel et non parallèle : deux formats prêts en même temps
  // feraient télécharger puis téléverser deux modèles de plusieurs
  // dizaines de Mo dans la même invocation, doublant la mémoire et le
  // temps alors que la Function est plafonnée à 60 s. Le format resté en
  // arrière sera finalisé au sondage suivant, quinze secondes plus tard.
  const refreshed = [];
  for (const job of jobs) {
    if (!job.externalJobId || !ACTIVE_STATUSES.includes(job.status)) {
      refreshed.push(job);
      continue;
    }
    try {
      const status = await scan3dProvider.getStatus(job.externalJobId);
      rawStatus = status.rawStatus;
      refreshed.push(await applyKiriStatus(job, status.rawStatus));
    } catch (err) {
      // Un fournisseur injoignable ne doit pas casser l'affichage : le
      // dernier état connu reste préférable à une page en erreur.
      console.error("[scan status] interrogation KIRI échouée", err);
      providerError = err instanceof Error ? err.message : "Interrogation impossible";
      refreshed.push(job);
    }
  }

  // Le lot est « en cours » tant qu'un seul de ses formats l'est : annoncer
  // « prêt » alors que l'USDZ manque encore laisserait croire que la
  // réalité augmentée fonctionne, ce qui est justement le cas qui a
  // dérouté Mouhamed au premier scan.
  const active = refreshed.filter((job) => ACTIVE_STATUSES.includes(job.status));
  const leader = active[0] ?? refreshed.find((job) => job.status === "successful") ?? refreshed[0];

  // Les formats se lisent sur le plat, pas sur un job : chaque job n'en
  // porte qu'un, et c'est leur réunion qui compte.
  const dishModels = await prisma.dish.findUnique({
    where: { id },
    select: { model3dGlbUrl: true, model3dUsdzUrl: true },
  });

  return NextResponse.json({
    quota,
    rawStatus,
    providerError,
    scanJob: {
      id: leader.id,
      status: leader.status,
      externalJobId: leader.externalJobId,
      // Seules les erreurs des jobs non aboutis remontent : un job réussi
      // après une reprise garde en base le message de sa tentative ratée,
      // et l'afficher sous un statut « prêt » est contradictoire.
      errorMessage:
        refreshed.find((job) => job.status !== "successful" && job.errorMessage)
          ?.errorMessage ?? null,
      glbUrl: dishModels?.model3dGlbUrl ?? null,
      usdzUrl: dishModels?.model3dUsdzUrl ?? null,
      createdAt: leader.createdAt,
      completedAt: leader.completedAt,
    },
  });
}

// Limites larges plutôt que strictes : la vraie validation (durée vidéo
// 3 min max, 1920x1080, 20 à 300 photos) doit vivre côté dashboard
// (S7-11), avant l'upload, pour ne jamais gaspiller un crédit KIRI sur
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

// KIRI vise la qualité maximale par défaut, ce qui a produit un modèle de
// 86 Mo au premier scan réel : assez pour faire planter Safari sur iPhone
// (S7-18), or le téléphone est précisément la cible du produit. Un plat vu
// dans un cadre de quelques centimètres sur un écran de téléphone n'a
// besoin ni d'un maillage de qualité studio ni de textures 4K.
//
// La texture pèse le plus lourd dans un modèle de photogrammétrie :
// passer de 4K à 1K divise sa surface par seize. Réglages surchargeables
// par requête, pour pouvoir remonter sur un plat vitrine sans toucher au
// code.
const DEFAULT_MODEL_QUALITY = 1; // 1 = Medium (0=High, 2=Low, 3=Ultra)
const DEFAULT_TEXTURE_QUALITY = 2; // 2 = 1K (0=4K, 1=2K, 3=8K)
const QUALITY_LEVELS = [0, 1, 2, 3] as const;

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
// KIRI Engine (Sprint 7). Reçoit un JSON { videoUrl } ou
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

  // Les deux garde-fous passent avant toute lecture du média : refuser
  // tôt évite de télécharger inutilement des dizaines de Mo, et surtout
  // d'engager un crédit facturé.
  if (await hasActiveScanJob(id)) {
    return NextResponse.json(
      { error: "Un scan est déjà en cours pour ce plat" },
      { status: 409 }
    );
  }

  // Comparé en crédits, pas en plats : un plat consomme deux crédits, et
  // s'il n'en reste qu'un, le scan partirait pour ne produire qu'un des
  // deux formats, en gaspillant un crédit sur un résultat inutilisable.
  const quota = await getScanQuota(restaurantUser.restaurantId);
  if (quota.remainingCredits < CREDITS_PER_SCAN) {
    return NextResponse.json(
      {
        error: `Quota de scans atteint pour ce mois (${quota.used}/${quota.limit})`,
        quota,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const algorithm: ScanAlgorithm = ALGORITHMS.includes(body.algorithm)
    ? body.algorithm
    : "featureless";
  const fileFormat: ScanFileFormat = FORMATS.includes(body.format) ? body.format : "glb";
  const modelQuality = QUALITY_LEVELS.includes(body.modelQuality)
    ? (body.modelQuality as 0 | 1 | 2 | 3)
    : DEFAULT_MODEL_QUALITY;
  const textureQuality = QUALITY_LEVELS.includes(body.textureQuality)
    ? (body.textureQuality as 0 | 1 | 2 | 3)
    : DEFAULT_TEXTURE_QUALITY;

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

  // Un appel KIRI ne renvoie qu'un seul format (S7-16), or l'aperçu 3D
  // veut du GLB et la réalité augmentée sur iPhone exige un USDZ. Les
  // deux appels partent donc de la même requête, avec le même média déjà
  // en mémoire : le retélécharger pour le second doublerait la durée
  // d'exécution sans rien apporter.
  const formats: ScanFileFormat[] = fileFormat === "glb" ? ["glb", "usdz"] : [fileFormat];

  async function startOneFormat(format: ScanFileFormat) {
    // Créé avant l'appel KIRI pour tracer même un échec au démarrage
    // (crédit insuffisant, clé invalide) - jamais d'appel fournisseur sans
    // ligne correspondante dans ScanJob.
    const job = await prisma.scanJob.create({
      data: {
        dishId: id,
        provider: "kiri",
        algorithm,
        status: "uploading",
        sourceMediaType: mediaType,
        sourceMediaUrl: videoUrl ?? imageUrls?.[0],
        requestedFormat: format,
      },
    });

    try {
      const { externalJobId } = await scan3dProvider.startScan({
        algorithm,
        mediaType,
        fileFormat: format,
        video,
        images,
        isMask: true,
        modelQuality,
        textureQuality,
      });
      return prisma.scanJob.update({
        where: { id: job.id },
        data: { externalJobId, status: "processing", creditsUsed: 1 },
      });
    } catch (err) {
      const kiriError = err instanceof KiriApiError ? err : null;
      await prisma.scanJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorCode: kiriError?.kiriCode,
          errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
        },
      });
      throw err;
    }
  }

  try {
    // Séquentiel et non parallèle : KIRI reçoit deux fois le même média
    // volumineux, et deux envois simultanés depuis la même Function
    // risquent de saturer sa bande passante sortante.
    const started = [];
    for (const format of formats) {
      started.push(await startOneFormat(format));
    }

    return NextResponse.json({
      scanJobId: started[0].id,
      externalJobId: started[0].externalJobId,
      status: started[0].status,
      formats: started.map((job) => job.requestedFormat),
    });
  } catch (err) {
    const kiriError = err instanceof KiriApiError ? err : null;

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
