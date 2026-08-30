import { describe, expect, it } from "vitest";
import { inspectGlb, formatBytes } from "./glb-inspect";

// Construit un GLB minimal en mémoire. Écrire la fixture à la main plutôt
// que de committer un binaire : le test reste lisible, et il documente le
// format autant qu'il le vérifie.
function buildGlb(json: unknown, binByteLength: number): Buffer {
  const jsonText = JSON.stringify(json);
  const jsonPad = (4 - (Buffer.byteLength(jsonText) % 4)) % 4;
  const jsonChunk = Buffer.from(jsonText + " ".repeat(jsonPad), "utf8");
  const binChunk = Buffer.alloc(binByteLength + ((4 - (binByteLength % 4)) % 4));

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

const SAMPLE = {
  asset: { generator: "Test" },
  bufferViews: [
    { byteLength: 1200 }, // positions
    { byteLength: 600 }, // indices
    { byteLength: 8000 }, // texture
  ],
  accessors: [
    { bufferView: 0, count: 100, type: "VEC3", min: [-1, 0, -2], max: [3, 1.5, 2] },
    { bufferView: 1, count: 150, type: "SCALAR" },
  ],
  images: [{ bufferView: 2, mimeType: "image/jpeg" }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  nodes: [{ scale: [0.01, 0.01, 0.01] }],
};

describe("inspectGlb", () => {
  it("sépare les octets de géométrie de ceux des textures", () => {
    const report = inspectGlb(buildGlb(SAMPLE, 9800));
    expect(report.geometryBytes).toBe(1800);
    expect(report.textureBytes).toBe(8000);
    expect(report.images).toEqual([{ mimeType: "image/jpeg", bytes: 8000 }]);
  });

  it("compte les triangles depuis l'accesseur d'indices", () => {
    expect(inspectGlb(buildGlb(SAMPLE, 9800)).triangles).toBe(50);
  });

  it("déduit les dimensions des bornes de l'accesseur POSITION", () => {
    expect(inspectGlb(buildGlb(SAMPLE, 9800)).dimensions).toEqual({ x: 4, y: 1.5, z: 4 });
  });

  it("signale une échelle portée par un noeud, qui fausserait les dimensions", () => {
    expect(inspectGlb(buildGlb(SAMPLE, 9800)).hasNodeTransforms).toBe(true);
  });

  it("ne compte qu'une fois un bufferView partagé par deux primitives", () => {
    const shared = {
      ...SAMPLE,
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0 }, indices: 1 },
            { attributes: { POSITION: 0 }, indices: 1 },
          ],
        },
      ],
    };
    const report = inspectGlb(buildGlb(shared, 9800));
    expect(report.geometryBytes).toBe(1800);
    expect(report.primitives).toBe(2);
  });

  it("refuse un fichier qui n'est pas un GLB", () => {
    expect(() => inspectGlb(Buffer.from("pas un glb du tout"))).toThrow(/GLB/);
  });
});

describe("formatBytes", () => {
  it("passe des octets aux mégaoctets", () => {
    expect(formatBytes(512)).toBe("512 o");
    expect(formatBytes(2048)).toBe("2.0 Ko");
    expect(formatBytes(94 * 1024 * 1024)).toBe("94.0 Mo");
  });
});

describe("inspectGlb sur un tampon tronqué", () => {
  it("mesure tout sans lire le binaire", () => {
    const full = buildGlb(SAMPLE, 9800);
    // On coupe dans le morceau binaire : c'est exactement ce que récupère
    // une lecture partielle sur le réseau.
    const truncated = full.subarray(0, full.length - 9000);

    const report = inspectGlb(truncated);
    expect(report.headerOnly).toBe(true);
    expect(report.fileBytes).toBe(full.length);
    expect(report.textureBytes).toBe(8000);
    expect(report.geometryBytes).toBe(1800);
    expect(report.triangles).toBe(50);
    expect(report.dimensions).toEqual({ x: 4, y: 1.5, z: 4 });
  });

  it("marque un fichier complet comme non tronqué", () => {
    expect(inspectGlb(buildGlb(SAMPLE, 9800)).headerOnly).toBe(false);
  });
});
