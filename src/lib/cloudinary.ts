import { v2 as cloudinary } from "cloudinary";

// Stockage images (section 7). Les modèles 3D sont censés vivre sur AWS
// S3 + CloudFront (section 7) mais aucun compte AWS n'est configuré pour
// l'instant — Cloudinary sert aussi de stockage temporaire pour les .glb/
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
