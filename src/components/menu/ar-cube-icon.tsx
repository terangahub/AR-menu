// Petit cube isométrique, repris du vocabulaire visuel de la landing pour
// signaler la réalité augmentée. En SVG inline plutôt qu'en dépendance
// d'icônes : c'est la seule icône dont le menu public a besoin. Partagé
// entre la vignette du menu et le bouton d'activation de la fiche plat,
// pour que le convive reconnaisse le même signe des deux côtés.
export function ArCubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m3.5 7 8.5 4.4L20.5 7M12 11.4v9.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
