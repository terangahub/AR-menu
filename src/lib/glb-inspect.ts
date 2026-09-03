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

// Tailles imposées par la spécification glTF. Elles servent à mesurer le
// poids **logique** d'un attribut depuis son accesseur, indépendamment du
// `bufferView` qui le porte : quand plusieurs attributs sont entrelacés
// dans un même `bufferView`, la longueur de celui-ci ne dit pas lequel
// pèse.
const COMPONENT_BYTES: Record<number, number> = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};

const TYPE_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const MAGIC_GLTF = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

export type GlbReport = {
  fileBytes: number;
  /** Vrai si seul l'en-tête a été analysé, le binaire n'ayant pas été lu. */
  headerOnly: boolean;
  jsonBytes: number;
  binBytes: number;
  /** Octets des bufferViews référencés par des images. */
  textureBytes: number;
  /** Octets des bufferViews référencés par des accesseurs de géométrie. */
  geometryBytes: number;
  /** Octets du tampon qu'aucune des deux catégories ne réclame. */
  otherBytes: number;
  triangles: number;
  vertices: number;
  /** Faux si le maillage répète ses sommets au lieu de les indexer. */
  indexed: boolean;
  /** Poids logique de chaque attribut de sommet, calculé depuis les
      accesseurs : il explique la ligne "géométrie" en la détaillant. */
  attributeBytes: { name: string; bytes: number }[];
  indexBytes: number;
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
  accessors?: {
    bufferView?: number;
    count?: number;
    type?: string;
    componentType?: number;
    min?: number[];
    max?: number[];
  }[];
  bufferViews?: { byteLength?: number }[];
  images?: { bufferView?: number; mimeType?: string; uri?: string }[];
  meshes?: {
    primitives?: { attributes?: Record<string, number>; indices?: number; mode?: number }[];
  }[];
  nodes?: { scale?: number[]; matrix?: number[] }[];
};

// Accepte un tampon **tronqué** : tout ce que ce rapport mesure vit dans
// l'en-tête et le morceau JSON, jamais dans le binaire lui-même. Les
// longueurs des `bufferView` sont déclarées dans le JSON, et celle du
// morceau binaire dans son propre en-tête de 8 octets. Lire les premiers
// mégaoctets suffit donc, ce qui évite de faire transiter 94 Mo par une
// Vercel Function pour n'en lire que le premier pour cent.
export function inspectGlb(buffer: Buffer): GlbReport {
  if (buffer.byteLength < 12) throw new Error("Fichier trop court pour être un GLB.");
  if (buffer.readUInt32LE(0) !== MAGIC_GLTF) {
    throw new Error("Ce fichier n'est pas un GLB (signature glTF absente).");
  }

  // La taille totale est déclarée dans l'en-tête : elle reste juste même
  // quand le tampon s'arrête au milieu du fichier.
  const declaredFileBytes = buffer.readUInt32LE(8);
  const headerOnly = buffer.byteLength < declaredFileBytes;

  let offset = 12;
  let json: GltfJson | null = null;
  let binBytes = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;

    if (chunkType === CHUNK_BIN) {
      // Sa longueur est déclarée dans l'en-tête du morceau : on la retient
      // sans exiger que ses données soient présentes.
      binBytes = chunkLength;
      break;
    }

    if (end > buffer.byteLength) break;

    if (chunkType === CHUNK_JSON) {
      json = JSON.parse(buffer.subarray(start, end).toString("utf8")) as GltfJson;
    }

    // Chaque morceau est aligné sur 4 octets.
    offset = end + ((4 - (chunkLength % 4)) % 4);
  }

  if (!json) {
    throw new Error(
      headerOnly
        ? "Morceau JSON absent des premiers octets lus : le descripteur du modèle dépasse la fenêtre analysée."
        : "Morceau JSON introuvable dans le GLB."
    );
  }

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

  const accessorBytes = (index: number | undefined): number => {
    if (index == null) return 0;
    const accessor = accessors[index];
    if (!accessor) return 0;
    const component = COMPONENT_BYTES[accessor.componentType ?? 5126] ?? 4;
    const components = TYPE_COMPONENTS[accessor.type ?? "SCALAR"] ?? 1;
    return (accessor.count ?? 0) * component * components;
  };

  const geometryViews = new Set<number>();
  const perAttribute = new Map<string, number>();
  let triangles = 0;
  let vertices = 0;
  let primitives = 0;
  let indexBytes = 0;
  let indexedPrimitives = 0;

  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      primitives += 1;

      for (const [name, accessorIndex] of Object.entries(primitive.attributes ?? {})) {
        const view = accessors[accessorIndex]?.bufferView;
        if (view != null) geometryViews.add(view);
        perAttribute.set(name, (perAttribute.get(name) ?? 0) + accessorBytes(accessorIndex));
      }

      const positionAccessor = primitive.attributes?.POSITION;
      vertices += positionAccessor != null ? (accessors[positionAccessor]?.count ?? 0) : 0;

      if (primitive.indices != null) {
        indexedPrimitives += 1;
        const accessor = accessors[primitive.indices];
        if (accessor?.bufferView != null) geometryViews.add(accessor.bufferView);
        indexBytes += accessorBytes(primitive.indices);
        // mode 4 (TRIANGLES) est le défaut quand `mode` est absent.
        if ((primitive.mode ?? 4) === 4) triangles += Math.floor((accessor?.count ?? 0) / 3);
      } else {
        const count = positionAccessor != null ? (accessors[positionAccessor]?.count ?? 0) : 0;
        if ((primitive.mode ?? 4) === 4) triangles += Math.floor(count / 3);
      }
    }
  }

  const attributeBytes = Array.from(perAttribute.entries())
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes);

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

  const jsonBytes = declaredFileBytes - binBytes - 12 - 8 * (binBytes > 0 ? 2 : 1);

  return {
    fileBytes: declaredFileBytes,
    headerOnly,
    jsonBytes,
    binBytes,
    textureBytes,
    geometryBytes,
    otherBytes: Math.max(0, binBytes - textureBytes - geometryBytes),
    triangles,
    vertices,
    // Un maillage non indexé répète chaque sommet pour chaque triangle qui
    // le touche : à géométrie égale, il pèse plusieurs fois plus lourd.
    indexed: primitives > 0 && indexedPrimitives === primitives,
    attributeBytes,
    indexBytes,
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
