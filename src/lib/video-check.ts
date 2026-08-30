// Contraintes vidéo de KIRI Engine, vérifiées dans le navigateur avant
// d'engager quoi que ce soit (ticket S9-07).
//
// L'enjeu n'est pas le confort : chaque scan consomme **deux crédits**
// (un par format, GLB et USDZ), soit environ 2 $, et un scan refusé les
// consomme quand même. La normalisation serveur (`S7-06`) corrige déjà la
// résolution en passant par une transformation Cloudinary, mais elle
// n'intervient qu'après un envoi qui peut durer plusieurs minutes sur le
// téléversement d'un téléphone. Refuser tout de suite ce qui est
// manifestement hors contrainte évite d'attendre pour rien.
//
// Une vidéo trop longue, elle, n'est pas rattrapable : KIRI la refuse
// (code 2009) et il n'existe aucune découpe automatique.

export const MAX_DURATION_SECONDS = 180;
export const MIN_DURATION_SECONDS = 5;

export type VideoCheck =
  | { ok: true; durationSeconds: number; width: number; height: number }
  | { ok: false; reason: "too_long" | "too_short" | "unreadable"; durationSeconds?: number };

// Lit les métadonnées sans décoder la vidéo entière : le navigateur ne
// télécharge que l'en-tête, ce qui reste instantané sur un fichier local
// de plusieurs centaines de mégaoctets.
export function checkVideoFile(file: File): Promise<VideoCheck> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    const finish = (result: VideoCheck) => {
      // Sans cette libération, l'objet URL retient le fichier entier en
      // mémoire tant que l'onglet est ouvert.
      URL.revokeObjectURL(url);
      resolve(result);
    };

    video.preload = "metadata";
    video.muted = true;

    video.onloadedmetadata = () => {
      const durationSeconds = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Certains conteneurs annoncent une durée infinie tant que le
      // fichier n'est pas parcouru : on ne bloque pas là-dessus, la
      // normalisation serveur reste le filet.
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        finish({ ok: false, reason: "unreadable" });
        return;
      }
      if (durationSeconds > MAX_DURATION_SECONDS) {
        finish({ ok: false, reason: "too_long", durationSeconds });
        return;
      }
      if (durationSeconds < MIN_DURATION_SECONDS) {
        finish({ ok: false, reason: "too_short", durationSeconds });
        return;
      }
      finish({ ok: true, durationSeconds, width, height });
    };

    // Un format que le navigateur ne sait pas lire n'est pas forcément un
    // format que KIRI refuse : on laisse passer plutôt que de bloquer à
    // tort un restaurateur sur un encodage exotique.
    video.onerror = () => finish({ ok: false, reason: "unreadable" });

    video.src = url;
  });
}

export function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return minutes > 0 ? `${minutes} min ${String(rest).padStart(2, "0")} s` : `${rest} s`;
}
