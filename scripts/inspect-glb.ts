// Mesure ce que contient réellement un fichier GLB (ticket S9-01).
//
//   npm run inspect-glb -- chemin/vers/modele.glb
//   npm run inspect-glb -- https://.../modele.glb
//
// Écrit en TypeScript et lancé par `tsx`, déjà présent dans le projet :
// la logique de mesure vit dans `src/lib/glb-inspect.ts`, testée
// unitairement, et ce fichier ne fait que la présenter. Aucun réseau n'est
// requis pour un fichier local, ce qui compte : la mesure doit pouvoir se
// faire depuis un poste qui n'atteint ni Vercel Blob ni KIRI.

import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatBytes, inspectGlb } from "../src/lib/glb-inspect";

const source = process.argv[2];
if (!source) {
  console.error("Usage : npm run inspect-glb -- <fichier.glb | url>");
  process.exit(1);
}

async function load(target: string): Promise<Buffer> {
  if (!/^https?:\/\//.test(target)) return readFile(target);

  const response = await fetch(target);
  if (!response.ok) throw new Error(`Téléchargement impossible : HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Copie locale : la mesure peut avoir à être refaite, et retélécharger
  // 90 Mo à chaque essai est du temps perdu.
  const cached = join(tmpdir(), `vorae-${Date.now()}.glb`);
  await writeFile(cached, buffer);
  console.log(`Copie locale : ${cached}\n`);
  return buffer;
}

async function main() {
  const report = inspectGlb(await load(source));
  const share = (bytes: number) =>
    report.fileBytes > 0 ? `${((bytes / report.fileBytes) * 100).toFixed(1)} %` : "-";
  const line = (label: string, bytes: number) =>
    console.log(`${label.padEnd(18)}${formatBytes(bytes).padEnd(11)}${share(bytes)}`);

  console.log(`Fichier           ${formatBytes(report.fileBytes)}`);
  console.log(`Produit par       ${report.generator ?? "non renseigné"}`);
  console.log("");
  line("Textures", report.textureBytes);
  line("Géométrie", report.geometryBytes);
  line("Reste du binaire", report.otherBytes);
  line("Descripteur JSON", report.jsonBytes);
  console.log("");
  console.log(`Triangles         ${report.triangles.toLocaleString("fr-CA")}`);
  console.log(`Maillages         ${report.meshes} (${report.primitives} primitives)`);

  if (report.images.length > 0) {
    console.log("");
    console.log("Images :");
    for (const image of report.images) {
      console.log(`  ${image.mimeType.padEnd(14)} ${formatBytes(image.bytes)}`);
    }
  }

  if (report.dimensions) {
    const { x, y, z } = report.dimensions;
    console.log("");
    console.log(
      `Dimensions        ${x.toFixed(3)} x ${y.toFixed(3)} x ${z.toFixed(3)} (unités du fichier)`
    );
    // Un GLB est interprété en mètres : c'est ce qui décide de la taille
    // réelle en réalité augmentée (S9-09). Une assiette plausible fait de
    // l'ordre de 26 cm.
    console.log(
      `Soit en AR        ${(x * 100).toFixed(0)} x ${(y * 100).toFixed(0)} x ${(z * 100).toFixed(0)} cm`
    );
    if (report.hasNodeTransforms) {
      console.log("  Attention : un noeud porte une échelle ou une matrice, la");
      console.log("  taille réelle peut différer de ces bornes.");
    }
  }

  console.log("");
  console.log("Lecture :");
  if (report.textureBytes > report.geometryBytes * 2) {
    console.log("  Le poids vient surtout des TEXTURES. Piste : réduire leur");
    console.log("  résolution et les recompresser (KTX2/Basis) avant de toucher");
    console.log("  au maillage.");
  } else if (report.geometryBytes > report.textureBytes * 2) {
    console.log("  Le poids vient surtout de la GÉOMÉTRIE. Piste : décimer le");
    console.log("  maillage, puis compresser (Draco ou meshopt).");
  } else {
    console.log("  Textures et géométrie pèsent du même ordre : les deux");
    console.log("  chantiers sont nécessaires, aucun ne suffira seul.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
