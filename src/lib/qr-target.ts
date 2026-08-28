// Chemin encodé dans un QR code imprimé. Isolé ici parce que deux endroits
// l'écrivent : la génération d'un nouveau QR code, et la mise à jour en
// masse quand le restaurant change son adresse de menu ou sa langue par
// défaut. Les deux doivent produire exactement la même forme, sinon un QR
// code régénéré cesse de correspondre à ceux déjà collés sur les tables.
//
// La locale est celle choisie par le restaurant : un convive qui scanne
// arrive dans la langue d'accueil de l'établissement, sans détection
// automatique (voir i18n/routing.ts, `localeDetection: false`, exigé par
// la Loi 96). Il peut ensuite basculer lui-même via le sélecteur du menu.
export function qrTargetPath(locale: string, slug: string, qrCodeId: string): string {
  return `/${locale}/${slug}?qr=${qrCodeId}`;
}
