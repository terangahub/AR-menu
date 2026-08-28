import { Link } from "@/i18n/navigation";

// Briques communes à tous les écrans du dashboard. Elles existent pour une
// raison précise : avant ce sprint, chaque page redéfinissait ses propres
// `rounded-lg border border-border p-4`, avec des rayons, des espacements
// et des tailles de titre qui divergeaient d'un écran à l'autre. Un seul
// endroit décide désormais de la forme d'un panneau, d'un en-tête de page
// et d'un état vide.

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-heading text-2xl leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-panel p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="font-heading text-base leading-tight">{title}</h2>}
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// Une variation se lit dans son sens (hausse ou baisse), pas seulement à sa
// couleur : le vert et le rouge seuls excluent 8 % des hommes daltoniens,
// et un restaurateur qui consulte ses chiffres au soleil sur un téléphone
// ne distingue pas mieux. Le signe et la flèche portent l'information.
export function StatTile({
  label,
  value,
  deltaPct,
  vsLabel,
}: {
  label: string;
  value: string | number;
  deltaPct?: number | null;
  vsLabel?: string;
}) {
  return (
    <div className="surface-panel flex flex-col gap-1 p-5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-heading text-3xl leading-none tabular-nums">{value}</span>
      {deltaPct != null && vsLabel && (
        <span
          className={`mt-1 text-xs tabular-nums ${
            deltaPct >= 0 ? "text-success" : "text-destructive"
          }`}
        >
          <span aria-hidden>{deltaPct >= 0 ? "↑" : "↓"} </span>
          {deltaPct >= 0 ? "+" : ""}
          {deltaPct}% {vsLabel}
        </span>
      )}
    </div>
  );
}

// Un écran vide qui ne dit rien laisse le restaurateur croire à une panne.
// Chaque état vide annonce donc ce qui manque et propose l'action qui le
// remplit, plutôt qu'une phrase constatant l'absence.
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-14 text-center">
      <p className="font-heading text-base">{title}</p>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-1 text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
