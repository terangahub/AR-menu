// Statuts ScanJob considérés "actifs" : soit KIRI travaille encore, soit
// son résultat est arrivé (statut brut 2) mais notre propre traitement
// (téléchargement du zip, téléversement Cloudinary) a échoué et doit être
// retenté au prochain sondage - sans qu'aucun nouveau crédit KIRI ne soit
// dépensé, puisqu'aucun nouvel appel de scan n'est refait.
//
// Module sans dépendance serveur (pas de Prisma, pas de Cloudinary) :
// importé à la fois par lib/scan-finalize.ts (serveur) et
// components/dashboard/dish-scan.tsx (client). Avant ce fichier, la même
// liste était dupliquée aux deux endroits et a divergé une fois
// "finalize_failed" ajouté d'un seul côté.
export const ACTIVE_SCAN_STATUSES = ["uploading", "processing", "queuing", "finalize_failed"];
