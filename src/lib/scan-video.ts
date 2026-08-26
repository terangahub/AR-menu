// KIRI refuse toute vidéo au-delà de 3 min ou de 1920x1080 (code 2009,
// rencontré en test réel sur une capture d'iPhone ordinaire). Un
// restaurateur ne convertira jamais sa vidéo lui-même : elle est déjà
// chez Cloudinary, on en demande donc une version dérivée conforme.
//
// c_limit ne fait que réduire et préserve le cadrage, y compris pour une
// vidéo filmée en portrait ; eo_180 coupe à 3 minutes ; f_mp4/vc_h264
// garantit un conteneur accepté, là où le .mov d'un iPhone est incertain.
//
// Partagé entre la route serveur et le panneau navigateur : les deux
// doivent viser exactement la même URL dérivée, sinon le navigateur
// attendrait la disponibilité d'un fichier que le serveur n'ira pas
// chercher.
export const KIRI_VIDEO_TRANSFORM = "c_limit,w_1920,h_1080,eo_180,f_mp4,vc_h264";

export function kiriReadyVideoUrl(url: string): string {
  const marker = "/video/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const head = url.slice(0, at + marker.length);
  const tail = url.slice(at + marker.length).replace(/\.[^./]+$/, ".mp4");
  return `${head}${KIRI_VIDEO_TRANSFORM}/${tail}`;
}
