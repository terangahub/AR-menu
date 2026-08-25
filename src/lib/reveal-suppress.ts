// Coupe-circuit pour `Reveal` (cf. reveal.tsx) pendant un défilement
// programmatique long, comme le "retour en haut" : sans lui, chaque
// section traversée disparaît puis réapparaît en un éclair pendant le
// défilement, comme si la page entière rejouait ses animations d'un
// coup. Un simple module partagé suffit, pas besoin de contexte React :
// `Reveal` ne fait que consulter la valeur au moment de l'évènement
// d'intersection, il n'a pas besoin d'être notifié d'un changement.
let suppressedUntil = 0;

export function suppressReveal(durationMs: number) {
  suppressedUntil = Date.now() + durationMs;
}

export function isRevealSuppressed() {
  return Date.now() < suppressedUntil;
}
