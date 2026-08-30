// Analyse d'un fichier GLB, sans dépendance et sans réseau.
//
// Existe pour répondre à une question précise (`S9-01`) : un modèle KIRI
// d'une seule assiette pèse environ 94 Mo, ce qui est anormal, et la
// solution n'est pas la même selon que ce poids vient de la géométrie, des
// textures, ou d'un maillage qui a capturé la table et l'arrière-plan avec
// le plat. Mesurer avant d'écrire le post-traitement (`S9-02`) évite de
// répéter l'erreur des réglages `modelQuality` / `textureQuality`, qu'on a
// crus efficaces pendant deux jours avant de mesurer qu'ils ne faisaient
// rien.
//
// Le même passage donne les dimensions du maillage, dont dépend `S9-09`
// (une assiette qui sort à trois mètres en réalité augmentée).
//
// Format GLB : un en-tête de 12 octets, puis des morceaux préfixés d'une
// longueur et d'un type. Le premier morceau est le JSON glTF, le second
// (facultatif) le tampon binaire.

const MAGIC_GLTF = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

export type GlbReport = {
  fileBytes: number;
  jsonBytes: number;
  binBytes: number;
  /** Octets des bufferViews référencés par des images. */
  textureBytes: number;
  /** Octets des bufferViews référencés par des accesseurs de géométrie. */
  geometryBytes: number;
  /** Octets du tampon qu'aucune des deux catégories ne réclame. */
  otherBytes: number;
  triangles: number;
  meshes: number;
  primitives: number;
  images: { mimeType: string; bytes: number }[];
  /** Dimensions de la boîte englobante, dans les unités du fichier. */
  dimensions: { x: number; y: number; z: number } | null;
  /** Vrai si un noeud porte une échelle ou une matrice non triviale. */
  hasNodeTransforms: boolean;
  generator: string | null;
};

type GltfJson = {
  asset?: { generator?: string };
  accessors?: { bufferView?: number; count?: number; type?: string; min?: number[]; max?: number[] }[];
  bufferViews?: { byteLength?: number }[];
  images?: { bufferView?: number; mimeType?: string; uri?: string }[];
  meshes?: {
    primitives?: { attributes?: Record<string, number>; indices?: number; mode?: number }[];
  }[];
  nodes?: { scale?: number[]; matrix?: number[] }[];
};

export function inspectGlb(buffer: Buffer): GlbReport {
  if (buffer.byteLength < 12) throw new Error("Fichier trop court pour être un GLB.");
  if (buffer.readUInt32LE(0) !== MAGIC_GLTF) {
    throw new Error("Ce fichier n'est pas un GLB (signature glTF absente).");
  }

  let offset = 12;
  let json: GltfJson | null = null;
  let binBytes = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;
    if (end > buffer.byteLength) break;

    if (chunkType === CHUNK_JSON) {
      json = JSON.parse(buffer.subarray(start, end).toString("utf8")) as GltfJson;
    } else if (chunkType === CHUNK_BIN) {
      binBytes = chunkLength;
    }

    // Chaque morceau est aligné sur 4 octets.
    offset = end + ((4 - (chunkLength % 4)) % 4);
  }

  if (!json) throw new Error("Morceau JSON introuvable dans le GLB.");

  const bufferViews = json.bufferViews ?? [];
  const accessors = json.accessors ?? [];
  const viewBytes = (index: number | undefined) =>
    index != null ? (bufferViews[index]?.byteLength ?? 0) : 0;

  // Un même bufferView peut être partagé : on compte les index, pas les
  // occurrences, sans quoi le total dépasserait la taille du fichier.
  const textureViews = new Set<number>();
  const images: { mimeType: string; bytes: number }[] = [];
  for (const image of json.images ?? []) {
    if (image.bufferView == null) continue;
    textureViews.add(image.bufferView);
    images.push({
      mimeType: image.mimeType ?? "inconnu",
      bytes: viewBytes(image.bufferView),
    });
  }

  const geometryViews = new Set<number>();
  let triangles = 0;
  let primitives = 0;

  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      primitives += 1;

      for (const accessorIndex of Object.values(primitive.attributes ?? {})) {
        const view = accessors[accessorIndex]?.bufferView;
        if (view != null) geometryViews.add(view);
      }

      if (primitive.indices != null) {
        const accessor = accessors[primitive.indices];
        if (accessor?.bufferView != null) geometryViews.add(accessor.bufferView);
        // mode 4 (TRIANGLES) est le défaut quand `mode` est absent.
        if ((primitive.mode ?? 4) === 4) triangles += Math.floor((accessor?.count ?? 0) / 3);
      } else {
        const positionAccessor = primitive.attributes?.POSITION;
        const count = positionAccessor != null ? (accessors[positionAccessor]?.count ?? 0) : 0;
        if ((primitive.mode ?? 4) === 4) triangles += Math.floor(count / 3);
      }
    }
  }

  const sumViews = (views: Set<number>) =>
    Array.from(views).reduce((total, index) => total + viewBytes(index), 0);

  const textureBytes = sumViews(textureViews);
  const geometryBytes = sumViews(geometryViews);

  // Boîte englobante : `min`/`max` des accesseurs POSITION sont obligatoires
  // dans la spécification glTF, donc lisibles sans décoder le binaire.
  let min: number[] | null = null;
  let max: number[] | null = null;
  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const index = primitive.attributes?.POSITION;
      if (index == null) continue;
      const accessor = accessors[index];
      if (!accessor?.min || !accessor?.max) continue;
      min = min ? min.map((v, i) => Math.min(v, accessor.min![i])) : [...accessor.min];
      max = max ? max.map((v, i) => Math.max(v, accessor.max![i])) : [...accessor.max];
    }
  }

  const dimensions =
    min && max ? { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] } : null;

  // Une échelle portée par un noeud change la taille réelle sans toucher
  // aux positions : sans ce drapeau, on conclurait à tort sur `S9-09`.
  const hasNodeTransforms = (json.nodes ?? []).some(
    (node) =>
      (node.scale != null && node.scale.some((v) => v !== 1)) ||
      (node.matrix != null && node.matrix.length === 16)
  );

  const jsonBytes = buffer.byteLength - binBytes - 12 - 8 * (binBytes > 0 ? 2 : 1);

  return {
    fileBytes: buffer.byteLength,
    jsonBytes,
    binBytes,
    textureBytes,
    geometryBytes,
    otherBytes: Math.max(0, binBytes - textureBytes - geometryBytes),
    triangles,
    meshes: (json.meshes ?? []).length,
    primitives,
    images,
    dimensions,
    hasNodeTransforms,
    generator: json.asset?.generator ?? null,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
