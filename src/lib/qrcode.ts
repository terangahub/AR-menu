import QRCode from "qrcode";

// Génération QR code (section 7 - librairie qrcode). Seul un chemin relatif
// (`/fr/mon-resto?qr=...`) est stocké en base : l'URL absolue est
// reconstruite à chaque génération, pour rester portable entre
// environnements (dev/staging/production, section 20).
//
// **Cette fonction décide de ce qui est gravé dans un carton imprimé.** Un
// QR code collé sur une table encode l'URL absolue produite ici, et plus
// rien ne peut la corriger à distance. Le choix du domaine n'est donc pas
// cosmétique : il est définitif pour tous les cartons déjà imprimés.
//
// `VERCEL_URL` est l'adresse **d'un déploiement**, pas celle du produit :
// elle change à chaque `git push` (`ar-menu-g082aq340-...`). Un QR code
// généré avec elle reste techniquement valide, mais il porte une adresse
// jetable, non conforme à la marque, et qui casse le jour où la protection
// de déploiement est activée. `VERCEL_PROJECT_PRODUCTION_URL`, elle, est
// l'alias stable du domaine de production (Next.js s'en sert lui-même pour
// résoudre `metadataBase`).
export function absoluteMenuUrl(targetUrl: string): string {
  return new URL(targetUrl, appBaseUrl()).toString();
}

function appBaseUrl(): string {
  // `||` et non `??` à chaque étape : Vercel a créé NEXT_PUBLIC_APP_URL
  // comme variable vide ("") lors de l'auto-détection des variables du
  // .env.example au premier import du projet. Une chaîne vide n'est pas
  // null/undefined, donc `??` la laissait passer telle quelle et
  // `new URL(path, "")` plantait avec ERR_INVALID_URL.
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit;

  // En production, l'alias stable du domaine, jamais l'URL du déploiement.
  // En preview, au contraire, on reste sur le déploiement courant : sinon
  // un QR code généré pendant un test renverrait le testeur vers la
  // production, avec d'autres données que celles qu'il vient de saisir.
  const host =
    (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    process.env.VERCEL_URL;

  return host ? `https://${host}` : "http://localhost:3000";
}

export async function generateQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 512, margin: 2 });
}

export async function generateQrPngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { width: 512, margin: 2 });
}
