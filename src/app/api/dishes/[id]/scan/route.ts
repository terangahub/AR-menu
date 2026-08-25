import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { scan3dProvider, KiriApiError, ScanAlgorithm, ScanFileFormat } from "@/lib/scan3d";

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

const ALGORITHMS: ScanAlgorithm[] = ["photo", "featureless", "3dgs"];
const FORMATS: ScanFileFormat[] = ["glb", "usdz", "obj", "fbx", "stl", "ply", "gltf", "xyz"];

// POST /api/dishes/[id]/scan - déclenche une capture 3D automatisée via
// KIRI Engine (Sprint 4.7). Reçoit soit une vidéo (champ "video"), soit
// un lot de photos (champ "images", répété), jamais les deux à la fois.
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

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const algorithmRaw = formData.get("algorithm");
  // Featureless Object par défaut : conçu pour les surfaces brillantes et
  // sans texture, exactement le cas des assiettes blanches et des sauces
  // (voir docs/roadmap-ai-instant-3d.md section 0).
  const algorithm: ScanAlgorithm = ALGORITHMS.includes(algorithmRaw as ScanAlgorithm)
    ? (algorithmRaw as ScanAlgorithm)
    : "featureless";

  const formatRaw = formData.get("format");
  const fileFormat: ScanFileFormat = FORMATS.includes(formatRaw as ScanFileFormat)
    ? (formatRaw as ScanFileFormat)
    : "glb";

  const videoFile = formData.get("video");
  const imageEntries = formData.getAll("images");

  let mediaType: "video" | "image";
  let video: { buffer: Buffer; filename: string } | undefined;
  let images: { buffer: Buffer; filename: string }[] | undefined;

  if (videoFile instanceof File) {
    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({ error: "Video too large" }, { status: 400 });
    }
    mediaType = "video";
    video = { buffer: Buffer.from(await videoFile.arrayBuffer()), filename: videoFile.name };
  } else {
    const imageFiles = imageEntries.filter((entry): entry is File => entry instanceof File);
    if (imageFiles.length < MIN_IMAGES || imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Entre ${MIN_IMAGES} et ${MAX_IMAGES} photos sont requises` },
        { status: 400 }
      );
    }
    for (const image of imageFiles) {
      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "Image too large" }, { status: 400 });
      }
    }
    mediaType = "image";
    images = await Promise.all(
      imageFiles.map(async (image) => ({
        buffer: Buffer.from(await image.arrayBuffer()),
        filename: image.name,
      }))
    );
  }

  // Créé avant l'appel KIRI pour tracer même un échec au démarrage
  // (crédit insuffisant, clé invalide) - jamais d'appel fournisseur sans
  // ligne correspondante dans ScanJob.
  const scanJob = await prisma.scanJob.create({
    data: {
      dishId: id,
      provider: "kiri",
      algorithm,
      status: "uploading",
      sourceMediaType: mediaType,
      requestedFormat: fileFormat,
    },
  });

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
    return NextResponse.json({ error: "Le scan n'a pas pu démarrer" }, { status: 502 });
  }
}
