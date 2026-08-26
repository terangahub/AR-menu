import { put } from "@vercel/blob";

// Stockage des modèles 3D issus du scan (Sprint 7). Cloudinary ne peut pas
// les recevoir : le plafond de taille des fichiers `raw` du compte (10 Mo,
// vérifié jusqu'au plan Plus à 99 $/mois inclus, qui plafonne à 20 Mo) est
// une limite sur le fichier total, pas par requête - aucun découpage ne la
// contourne. Un modèle KIRI réel pèse couramment 80-90 Mo. Voir CONTEXT.md
// section 5 et BOARD.md (D-04, S7-15).
//
// Vercel Blob est retenu plutôt qu'AWS S3 : déjà sur la même plateforme
// que l'hébergement, aucun nouveau compte externe à créer, juste le
// stockage Blob à activer dans les réglages du projet Vercel (qui injecte
// alors BLOB_READ_WRITE_TOKEN automatiquement).
//
// Ne concerne que le résultat du scan. Les photos de plats et la vidéo
// source du scan restent sur Cloudinary : bien en-dessous de ces
// plafonds, et déjà en place.
const CONTENT_TYPES: Record<"glb" | "usdz", string> = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
};

// Au-delà de ce seuil, l'envoi passe en plusieurs parties en parallèle
// (gérées par le SDK) plutôt qu'en une seule requête.
const MULTIPART_THRESHOLD_BYTES = 8 * 1024 * 1024;

export async function uploadModelToBlob(
  buffer: Buffer,
  options: { pathname: string; extension: "glb" | "usdz" }
): Promise<{ url: string }> {
  // Pas de vérification manuelle d'une variable d'environnement ici :
  // connecter le store au projet Vercel authentifie via OIDC
  // (BLOB_STORE_ID + VERCEL_OIDC_TOKEN, injectées automatiquement), sans
  // BLOB_READ_WRITE_TOKEN. Le SDK résout lui-même la bonne méthode ; une
  // vérification figée sur une seule variable bloquerait à tort le
  // chemin normal. S'il manque vraiment une configuration, put() échoue
  // avec son propre message, qui remonte tel quel.
  const blob = await put(options.pathname, buffer, {
    access: "public",
    contentType: CONTENT_TYPES[options.extension],
    addRandomSuffix: false,
    // Une reprise (S7-14) peut retenter le même fichier après un échec
    // partiel précédent : sans ceci, le deuxième essai échouerait sur un
    // chemin déjà occupé plutôt que de le remplacer.
    allowOverwrite: true,
    multipart: buffer.byteLength > MULTIPART_THRESHOLD_BYTES,
  });

  return { url: blob.url };
}
