import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

// Mur d'avis (cahier section 12.1 #8, "wall of love"), design repris de
// webglow.ca : deux bandeaux qui défilent en sens opposés, masque en
// dégradé sur les bords, pause au survol, halo en forme de coeur derrière
// le titre. Couleurs adaptées aux tokens Vorae (le rouge #A60000 de
// WebGlow devient primary/secondary).
//
// ATTENTION, contenu de démonstration : ces avis sont inventés et ne
// correspondent à aucun client réel. Volontairement sans photo de
// personne (des portraits de banque d'images associés à de fausses
// citations donneraient l'illusion de vrais témoignages) : de simples
// pastilles d'initiales, qui se lisent comme un gabarit. À remplacer par
// de vrais avis avant toute mise en production, cf. la ligne rouge
// éditoriale de la section 12.3 du cahier ("la preuve vient des chiffres
// et des études de cas").
type Review = {
  initials: string;
  nameKey: string;
  roleKey: string;
  textKey: string;
};

const REVIEWS: Review[] = [
  { initials: "SL", nameKey: "r1Name", roleKey: "r1Role", textKey: "r1Text" },
  { initials: "MT", nameKey: "r2Name", roleKey: "r2Role", textKey: "r2Text" },
  { initials: "AD", nameKey: "r3Name", roleKey: "r3Role", textKey: "r3Text" },
  { initials: "JC", nameKey: "r4Name", roleKey: "r4Role", textKey: "r4Text" },
  { initials: "KB", nameKey: "r5Name", roleKey: "r5Role", textKey: "r5Text" },
  { initials: "PN", nameKey: "r6Name", roleKey: "r6Role", textKey: "r6Text" },
];

function ReviewCard({
  review,
  t,
}: {
  review: Review;
  t: (key: string) => string;
}) {
  return (
    <figure className="w-[340px] shrink-0 rounded-card border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition-colors duration-300 hover:border-white/[0.16] sm:w-[400px]">
      <div className="mb-4 flex flex-row items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/50 font-heading text-xs font-semibold text-foreground ring-1 ring-white/10">
          {review.initials}
        </span>
        <div className="flex flex-col">
          <figcaption className="font-heading text-sm font-medium text-foreground">
            {t(review.nameKey)}
          </figcaption>
          <p className="text-xs text-muted-foreground">{t(review.roleKey)}</p>
        </div>
      </div>
      <blockquote className="text-sm leading-relaxed text-foreground/80">
        {t(review.textKey)}
      </blockquote>
      <div className="mt-4 flex items-center gap-1 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} fill="currentColor" stroke="none" />
        ))}
      </div>
    </figure>
  );
}

export function ReviewsSection() {
  const t = useTranslations("Landing.reviews");
  const firstRow = REVIEWS.slice(0, 3);
  const secondRow = REVIEWS.slice(3, 6);

  return (
    <section id="reviews" className="relative w-full overflow-hidden py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-10 top-20 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-20 right-10 -z-10 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]"
      />

      <div className="relative z-10 mx-auto mb-20 max-w-4xl px-5 text-center">
        {/* Halo en forme de coeur derrière le titre, repris de webglow.ca. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-[55%]"
        >
          <svg viewBox="0 0 800 500" fill="none" className="h-full w-full">
            <defs>
              <linearGradient id="voraeHeartStroke" x1="400" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.45)" />
                <stop offset="50%" stopColor="hsl(var(--primary) / 0.12)" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
              </linearGradient>
              <radialGradient
                id="voraeHeartGlow"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(400 200) rotate(90) scale(300 400)"
              >
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.14" />
                <stop offset="0.6" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
                <stop offset="1" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path
              d="M400 155 C 320 65 150 100 150 300 C 150 435 400 500 400 500 C 400 500 650 435 650 300 C 650 100 480 65 400 155 Z"
              fill="url(#voraeHeartGlow)"
            />
            <path
              d="M400 155 C 320 65 150 100 150 300 C 150 435 400 500 400 500 C 400 500 650 435 650 300 C 650 100 480 65 400 155 Z"
              stroke="url(#voraeHeartStroke)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {t("eyebrow")}
        </span>
        <h2 className="text-gradient mt-8 text-balance font-heading text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* `group` sur le conteneur : survoler n'importe où met les deux
          bandeaux en pause d'un coup, ce qui permet de lire un avis. */}
      <div className="group relative flex flex-col gap-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-infinite-scroll flex-row gap-6 pl-6">
          {[...firstRow, ...firstRow, ...firstRow, ...firstRow].map((review, i) => (
            <ReviewCard key={`row1-${i}`} review={review} t={t} />
          ))}
        </div>
        <div
          className="flex w-max animate-infinite-scroll flex-row gap-6 pl-6"
          style={{ animationDirection: "reverse" }}
        >
          {[...secondRow, ...secondRow, ...secondRow, ...secondRow].map((review, i) => (
            <ReviewCard key={`row2-${i}`} review={review} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
