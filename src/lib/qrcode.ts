import QRCode from "qrcode";

// Génération QR code (section 7 — librairie qrcode). L'URL absolue est
// reconstruite à la génération à partir de NEXT_PUBLIC_APP_URL + du chemin
// relatif stocké en base, pour rester portable entre environnements
// (dev/staging/production, section 20).
export function absoluteMenuUrl(targetUrl: string): string {
  // NEXT_PUBLIC_APP_URL n'est pas encore configuré sur Vercel — on retombe
  // sur VERCEL_URL (fourni automatiquement par Vercel, sans configuration)
  // avant le dernier recours local.
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(targetUrl, base).toString();
}

export async function generateQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 512, margin: 2 });
}
