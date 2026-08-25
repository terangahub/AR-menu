import type { LucideIcon } from "lucide-react";

// Visuel de la section "Allergènes" : les pastilles sont disposées en
// anneau autour de l'icône, chacune s'illuminant à tour de rôle - une
// idée de "couverture systématique" plus parlante qu'un simple champ de
// texte qui défile, et qui différencie cette carte des deux autres.
//
// Position calculée par trigonométrie au rendu plutôt qu'en CSS
// (rotate + translate + rotate inverse) : le calcul direct est plus
// lisible et évite les pièges d'ordre de composition des `transform`.
// Aucun état ni effet nécessaire, donc pas de "use client" ici.
export function FeatureAllergenRing({
  tags,
  icon: Icon,
  label,
}: {
  tags: readonly string[];
  icon: LucideIcon;
  label: string;
}) {
  const count = tags.length;
  const radiusX = 42;
  // Rayon vertical volontairement plus court que l'horizontal : la
  // pastille du bas venait sinon se superposer au libellé de la carte,
  // posé en `bottom-4`, ce qui se voyait surtout en mobile où la carte
  // est plus petite alors que le libellé garde sa taille.
  const radiusY = 27;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-white/[0.08] bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--secondary)/0.5),transparent)]"
      />

      <div className="absolute inset-0">
        {tags.map((tag, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + radiusX * Math.cos(angle);
          const y = 50 + radiusY * Math.sin(angle);
          return (
            <span
              key={tag}
              className="allergen-tag absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9px] sm:text-[10px]"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${(i / count) * 6}s`,
              }}
            >
              {tag}
            </span>
          );
        })}

        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.8)] backdrop-blur-sm">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </div>

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
