import { v2 as cloudinary } from "cloudinary";

// Stockage images (section 7). Les modèles 3D sont censés vivre sur AWS
// S3 + CloudFront (section 7) mais aucun compte AWS n'est configuré pour
// l'instant - Cloudinary sert aussi de stockage temporaire pour les .glb/
// .usdz (resource_type "raw") en attendant la mise en place de S3.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; resourceType: "image" | "raw"; publicId?: string }
) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        public_id: options.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Signature pour un upload direct depuis le client vers Cloudinary (Sprint
// 4.7, capture 3D). Les Vercel Functions refusent tout corps de requête
// au-dela d'environ 4,5 Mo (FUNCTION_PAYLOAD_TOO_LARGE) - une video de
// scan de 20-30s depasse toujours ce seuil. La video ne doit donc jamais
// transiter par notre route, seulement l'URL du resultat une fois
// televerse directement chez Cloudinary. Voir CONTEXT.md section 5.
export function signUpload(params: {
  folder: string;
  publicId: string;
  resourceType: "video" | "image";
}) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  // Les noms manquants sont cites explicitement : savoir laquelle des
  // trois fait defaut evite un aller-retour de deploiement complet. Seuls
  // les noms sortent, jamais les valeurs.
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean);
  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error(
      `Configuration Cloudinary manquante : ${missing.join(", ")} - voir .env.example`
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder: params.folder, public_id: params.publicId, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: params.folder,
    publicId: params.publicId,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${params.resourceType}/upload`,
  };
}
