// Adaptateur pour la capture 3D automatisée des plats (Sprint 4.7,
// docs/roadmap-ai-instant-3d.md section 0). Sur le principe de
// src/lib/billing.ts : la logique métier (routes, ScanJob) ne parle
// jamais directement à un fournisseur, elle passe par cette interface -
// KIRI Engine aujourd'hui, RealityScan 2.1 en plan B sans réécrire les
// routes si besoin de changer.

const KIRI_BASE_URL = "https://api.kiriengine.app/api/v1/open";

export type ScanAlgorithm = "photo" | "featureless" | "3dgs";
export type ScanMediaType = "video" | "image";
// KIRI n'accepte qu'une seule valeur par appel, pas une liste - voir la
// mise en garde en section 0 du document de roadmap sur le doute glb+usdz
// en un seul appel ou deux, à vérifier par un test réel.
export type ScanFileFormat = "glb" | "usdz" | "obj" | "fbx" | "stl" | "ply" | "gltf" | "xyz";

export interface ScanFile {
  buffer: Buffer;
  filename: string;
}

export interface StartScanInput {
  algorithm: ScanAlgorithm;
  mediaType: ScanMediaType;
  fileFormat: ScanFileFormat;
  video?: ScanFile;
  images?: ScanFile[];
  // Non documentés pour l'algorithme Featureless - ignorés par
  // l'implémentation KIRI si l'algorithme est "featureless".
  modelQuality?: 0 | 1 | 2 | 3; // 0=High, 1=Medium, 2=Low, 3=Ultra
  textureQuality?: 0 | 1 | 2 | 3; // 0=4K, 1=2K, 2=1K, 3=8K
  isMask?: boolean;
}

export type ScanStatus =
  | "uploading"
  | "processing"
  | "failed"
  | "successful"
  | "queuing"
  | "expired";

export interface ScanStatusResult {
  status: ScanStatus;
  rawStatus: number;
}

export interface Scan3dProvider {
  startScan(input: StartScanInput): Promise<{ externalJobId: string }>;
  getStatus(externalJobId: string): Promise<ScanStatusResult>;
  // Lien de téléchargement valable 60 minutes seulement (rétention KIRI :
  // 3 jours avant suppression du modèle lui-même) - à téléverser sur
  // Cloudinary sans attendre côté appelant.
  getModelZip(externalJobId: string): Promise<{ modelUrl: string }>;
  getBalance(): Promise<{ balance: number }>;
}

// Statut brut renvoyé par getStatus et par le webhook - corrige une
// erreur de la première version de ce chantier : 4 = Expired, pas
// "Exported".
const STATUS_MAP: Record<number, ScanStatus> = {
  [-1]: "uploading",
  0: "processing",
  1: "failed",
  2: "successful",
  3: "queuing",
  4: "expired",
};

export class KiriApiError extends Error {
  constructor(
    public httpStatus: number,
    public kiriCode: number | undefined,
    message: string
  ) {
    super(message);
    this.name = "KiriApiError";
  }
}

function getKiriApiKey(): string {
  const key = process.env.KIRI_ENGINE_API_KEY;
  if (!key) {
    throw new Error("KIRI_ENGINE_API_KEY manquante - voir .env.example");
  }
  return key;
}

// Un endpoint par algorithme x type de média (6 au total), pas un
// endpoint générique - corrige une hypothèse erronée de la première
// version de ce chantier, basée sur une spec moins fiable.
function endpointFor(algorithm: ScanAlgorithm, mediaType: ScanMediaType): string {
  return `${KIRI_BASE_URL}/${algorithm}/${mediaType}`;
}

async function kiriFetch(url: string, init: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKiriApiKey()}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  // Le champ `code` n'est pas fiable comme indicateur de succès : un
  // appel réussi a renvoyé `code: 200` en test réel, alors que les
  // exemples de la doc montrent `code: 0`. Se fier au champ `ok`.
  if (!body.ok) {
    throw new KiriApiError(res.status, body.code, body.msg ?? "Erreur API KIRI");
  }
  return body;
}

export const kiriProvider: Scan3dProvider = {
  async startScan(input) {
    const path = endpointFor(input.algorithm, input.mediaType);
    const form = new FormData();

    if (input.mediaType === "video") {
      if (!input.video) throw new Error("Fichier vidéo manquant pour un scan vidéo");
      form.append(
        "videoFile",
        new Blob([new Uint8Array(input.video.buffer)]),
        input.video.filename
      );
    } else {
      if (!input.images?.length) {
        throw new Error("Fichiers image manquants pour un scan photo");
      }
      for (const image of input.images) {
        form.append(
          "imagesFiles",
          new Blob([new Uint8Array(image.buffer)]),
          image.filename
        );
      }
    }

    form.append("fileFormat", input.fileFormat);

    // Paramètres de qualité non documentés pour Featureless Object -
    // KIRI les ignorerait probablement, mais on ne les envoie pas pour
    // rester fidèle à la doc officielle plutôt que de deviner.
    if (input.algorithm !== "featureless") {
      if (input.modelQuality !== undefined) {
        form.append("modelQuality", String(input.modelQuality));
      }
      if (input.textureQuality !== undefined) {
        form.append("textureQuality", String(input.textureQuality));
      }
    }
    if (input.algorithm === "photo" || input.algorithm === "3dgs") {
      if (input.isMask !== undefined) {
        form.append("isMask", input.isMask ? "1" : "0");
      }
    }
    if (input.algorithm === "3dgs") {
      // isMesh=1 systématique : on veut toujours un maillage GLB/USDZ
      // pour l'affichage AR existant, jamais les splats bruts seuls.
      form.append("isMesh", "1");
    }

    const body = await kiriFetch(path, { method: "POST", body: form });
    return { externalJobId: body.data.serialize as string };
  },

  async getStatus(externalJobId) {
    const url = `${KIRI_BASE_URL}/model/getStatus?serialize=${encodeURIComponent(externalJobId)}`;
    const body = await kiriFetch(url, { method: "GET" });
    const rawStatus = body.data.status as number;
    return { status: STATUS_MAP[rawStatus] ?? "processing", rawStatus };
  },

  async getModelZip(externalJobId) {
    const url = `${KIRI_BASE_URL}/model/getModelZip?serialize=${encodeURIComponent(externalJobId)}`;
    const body = await kiriFetch(url, { method: "GET" });
    return { modelUrl: body.data.modelUrl as string };
  },

  async getBalance() {
    const body = await kiriFetch(`${KIRI_BASE_URL}/balance`, { method: "GET" });
    return { balance: body.data.balance as number };
  },
};

// Fournisseur actif unique, résolu ici plutôt que dans chaque route -
// même principe que STRIPE_SECRET_KEY dans lib/billing.ts. RealityScan
// 2.1 (plan B) n'est pas implémenté : brancher une seconde constante
// ici le jour où c'est nécessaire, sans toucher aux routes qui importent
// `scan3dProvider`.
export const scan3dProvider: Scan3dProvider = kiriProvider;
