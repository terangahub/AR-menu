import type { LucideIcon } from "lucide-react";

// Champ de mots défilants, repris de la section "Hardened security" de
// reflect.app : des rangées de texte en chasse fixe qui glissent en sens
// alternés, masquées en dégradé radial pour s'éteindre sur les bords,
// avec une icône lumineuse posée au centre.
//
// L'intérêt par rapport à une photo décorative : le contenu du champ
// illustre le bénéfice au lieu de le décorer. Le champ "allergènes"
// affiche de vrais noms d'allergènes, le champ "langues" le même plat
// écrit dans plusieurs langues, etc.
//
// Les rangées sont construites de façon déterministe (décalage par index,
// pas de Math.random) : une valeur aléatoire différente entre le rendu
// serveur et le rendu client provoquerait une erreur d'hydratation React.
const ROW_COUNT = 11;

function buildRow(words: string[], rowIndex: number): string[] {
  // Chaque rangée démarre à un décalage différent pour que les colonnes
  // ne s'alignent pas verticalement, ce qui trahirait la répétition.
  const offset = (rowIndex * 3) % words.length;
  const rotated = [...words.slice(offset), ...words.slice(0, offset)];
  // Répété assez de fois pour couvrir les écrans larges, puis dupliqué
  // par le rendu ci-dessous pour que la boucle à -50% soit invisible.
  return [...rotated, ...rotated, ...rotated];
}

export function FeatureField({
  words,
  icon: Icon,
  label,
}: {
  words: string[];
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-white/[0.08] bg-background">
      {/* Halo violet derrière le champ. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.55),transparent)]"
      />

      {/* Le champ de texte. Masque radial : lisible au centre, éteint sur
          les bords, ce qui évite une coupure nette au ras du cadre. */}
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col justify-center gap-1 [mask-image:radial-gradient(70%_70%_at_50%_50%,#000_20%,transparent_100%)]"
      >
        {Array.from({ length: ROW_COUNT }).map((_, row) => {
          const cells = buildRow(words, row);
          return (
            <div
              key={row}
              className="flex w-max animate-infinite-scroll flex-nowrap"
              style={{
                // Sens et vitesse alternés d'une rangée à l'autre : sans
                // ça le champ se lit comme un seul bloc qui glisse.
                animationDirection: row % 2 === 0 ? "normal" : "reverse",
                animationDuration: `${38 + (row % 4) * 9}s`,
              }}
            >
              {[...cells, ...cells].map((word, i) => (
                <span
                  key={i}
                  className={`px-3 font-mono text-[11px] tracking-tight sm:text-xs ${
                    (row + i) % 5 === 0 ? "text-primary/90" : "text-foreground/45"
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Icône centrale. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.8)] backdrop-blur-sm">
          <Icon className="h-6 w-6 text-primary" />
        </span>
        <span className="rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  );
}
