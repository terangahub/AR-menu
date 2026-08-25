import { useTranslations } from "next-intl";

// Bandeau défilant sous le hero, repris du design de webglow.ca :
// masque en dégradé sur les bords, désaturation qui se lève au survol,
// et pause de l'animation quand la souris entre dans le bandeau.
//
// Volontairement des TYPES d'établissement, pas des noms de marques ou de
// restaurants réels : afficher "St-Hubert" ou "Pacini" comme client alors
// qu'aucun ne l'est serait une fausse référence. webglow.ca fait la même
// chose (Salons, Cliniques, Garages...). Remplaçable par de vrais logos
// clients dès qu'il y en aura.
const SEGMENTS = [
  "Bistros",
  "Sushi",
  "Brunchs",
  "Pizzerias",
  "Cafés",
  "Gastronomie",
  "Food trucks",
  "Traiteurs",
  "Grillades",
  "Végétarien",
];

export function TrustedMarquee() {
  const t = useTranslations("Landing.trusted");

  return (
    <section className="relative z-10 w-full pb-8">
      <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {t("label")}
      </p>

      <div className="group inline-flex w-full flex-nowrap overflow-hidden opacity-50 grayscale transition-all duration-700 hover:opacity-90 hover:grayscale-0 [mask-image:linear-gradient(to_right,transparent_0,black_128px,black_calc(100%-128px),transparent_100%)]">
        <div className="flex w-max animate-infinite-scroll items-center">
          {/* Le contenu est rendu deux fois : la seconde passe est la copie
              que la translation de -50% amène à la place de la première. */}
          {[...SEGMENTS, ...SEGMENTS].map((segment, i) => (
            <span
              key={`${segment}-${i}`}
              className="mx-8 whitespace-nowrap font-heading text-2xl font-medium text-foreground sm:text-3xl"
            >
              {segment}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
