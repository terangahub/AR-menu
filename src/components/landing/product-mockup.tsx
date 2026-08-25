"use client";

import { useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Search, ChevronLeft, RotateCw, Move3d } from "lucide-react";

// Maquette du menu Vorae dans un telephone, posee dans le hero.
//
// Remplace la photo de plat qui s'y trouvait : reflect.app montre son
// application dans son hero, pas une image d'ambiance. Une photo achetee
// ne dit pas ce que fait le produit ; une maquette de l'ecran que verra
// le convive, si.
//
// Reconstitue en HTML plutot qu'en capture d'ecran : le texte reste net
// a toutes les densites d'ecran, suit la langue choisie, et n'a pas
// besoin d'etre refait a chaque evolution du menu.
//
// Interactive (filtres de categorie, ouverture de la vue AR) a la
// demande du client : un aperçu qu'on peut manipuler soi-meme convainc
// mieux qu'une image fixe. La vue AR reste une illustration du produit
// (pas d'appareil photo, pas de vrai modele 3D charge ici) : elle montre
// ce que fait Vorae sans pretendre le faire elle-meme dans le hero.
const DISHES = [
  {
    key: "d1",
    image: "/dish-signature-bowl.jpg",
    price: "18,50 $",
    ar: true,
    category: "mains",
  },
  {
    key: "d2",
    image: "/dish-salad.jpg",
    price: "12,00 $",
    ar: true,
    category: "starters",
  },
  {
    key: "d3",
    image: "/dish-pasta.jpg",
    price: "16,00 $",
    ar: false,
    category: "mains",
  },
  {
    key: "d4",
    image: "/dish-burger.jpg",
    price: "19,50 $",
    ar: true,
    category: "mains",
  },
] as const;

const CATEGORIES = [
  { key: "catAll", value: "all" },
  { key: "catMains", value: "mains" },
  { key: "catStarters", value: "starters" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function ProductMockup() {
  const t = useTranslations("Landing.mockup");
  const [category, setCategory] = useState<Category>("all");
  const [arDish, setArDish] = useState<(typeof DISHES)[number] | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const visibleDishes = DISHES.filter(
    (dish) => category === "all" || dish.category === category
  );

  // Legere inclinaison qui suit la souris, desktop seulement (aucun
  // `mousemove` ne se declenche au toucher) : donne au telephone un
  // relief 3D discret plutot qu'une image plate posee la.
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* Badges flottants : rappellent les benefices cles autour du
          telephone, en plus de ce que montre l'ecran lui-meme. `right`/
          `left: calc(100% + Npx)` plutot qu'un simple `-left-10` : un
          decalage negatif fixe ne suffit pas a sortir tout le badge du
          cadre si son texte est plus large que le decalage (constate en
          francais, le badge chevauchait l'ecran du telephone) - avec
          `calc(100% + ...)`, le badge part toujours du bord du telephone
          vers l'exterieur, quelle que soit sa largeur. Positions figees
          en dur (pas de Math.random), memes raisons d'hydratation
          qu'ailleurs dans le projet. */}
      <span
        aria-hidden
        className="animate-float-badge absolute top-[18%] z-20 hidden -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[0_10px_30px_-10px_hsl(var(--secondary))] backdrop-blur-md lg:flex"
        style={{ animationDelay: "0s", right: "calc(100% + 16px)" }}
      >
        <Sparkles className="h-3 w-3 text-primary" />
        {t("badgeAr")}
      </span>
      <span
        aria-hidden
        className="animate-float-badge absolute top-[46%] z-20 hidden -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[0_10px_30px_-10px_hsl(var(--secondary))] backdrop-blur-md lg:flex"
        style={{ animationDelay: "1.6s", left: "calc(100% + 16px)" }}
      >
        {t("badgeLanguages")}
      </span>
      <span
        aria-hidden
        className="animate-float-badge absolute bottom-[10%] z-20 hidden -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[0_10px_30px_-10px_hsl(var(--secondary))] backdrop-blur-md lg:flex"
        style={{ animationDelay: "3.2s", right: "calc(100% + 16px)" }}
      >
        {t("badgeNoApp")}
      </span>

      {/* Chassis du telephone */}
      <div
        className="relative rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-white/20 to-white/5 p-[3px] shadow-[0_40px_120px_-20px_hsl(var(--secondary)),0_0_60px_-20px_hsl(var(--primary)/0.6)] transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="relative h-[420px] overflow-hidden rounded-[2.45rem] bg-background sm:h-[460px]">
          {/* Encoche */}
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />

          {arDish ? (
            <ArView dish={arDish} label={t(arDish.key)} onBack={() => setArDish(null)} />
          ) : (
            <div className="px-4 pb-5 pt-9">
              {/* En-tete du menu */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-sm font-medium text-foreground">
                    {t("restaurant")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("table")}</p>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">
                  FR
                </span>
              </div>

              {/* Barre de recherche factice */}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
                <Search className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{t("search")}</span>
              </div>

              {/* Filtres de categorie, cliquables */}
              <div className="mt-3 flex gap-1.5">
                {CATEGORIES.map(({ key, value }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`rounded-full px-2.5 py-1 text-[10px] transition-colors ${
                      category === value
                        ? "bg-primary text-primary-foreground"
                        : "border border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>

              {/* Liste de plats */}
              <div className="mt-3 flex flex-col gap-2">
                {visibleDishes.map((dish) => (
                  <div
                    key={dish.key}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {t(dish.key)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{dish.price}</p>
                    </div>
                    {dish.ar && (
                      <button
                        type="button"
                        onClick={() => setArDish(dish)}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[9px] font-medium text-primary ring-1 ring-primary/25 transition-colors hover:bg-primary/25"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        AR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ecran affiché quand on touche le badge AR d'un plat : une illustration
// du produit (surface au sol, plat qui flotte au-dessus avec son ombre,
// reticule qui pulse), pas une vraie session AR - honnête sur ce qu'est
// le hero d'une page marketing.
function ArView({
  dish,
  label,
  onBack,
}: {
  dish: (typeof DISHES)[number];
  label: string;
  onBack: () => void;
}) {
  const t = useTranslations("Landing.mockup");

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-black/40 px-4 pb-5 pt-9">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-foreground"
          aria-label={t("arBack")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="truncate text-xs font-medium text-foreground">{label}</span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-medium text-primary ring-1 ring-primary/25">
          <Sparkles className="h-2.5 w-2.5" />
          {t("arLive")}
        </span>
      </div>

      <div className="relative mt-4 flex flex-1 flex-col items-center justify-center">
        {/* Surface au sol : ellipse en perspective, comme un plan detecte. */}
        <div
          aria-hidden
          className="absolute bottom-[22%] h-16 w-[78%] rounded-[50%] border border-primary/30 bg-primary/5"
          style={{ transform: "perspective(200px) rotateX(60deg)" }}
        />
        <div
          aria-hidden
          className="ar-scan-ring absolute bottom-[26%] h-10 w-10 rounded-full border-2 border-primary/70"
        />

        {/* Le plat, comme s'il flottait au-dessus de la surface. */}
        <div className="relative z-10 mb-10">
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 h-3 w-20 -translate-x-1/2 rounded-[50%] bg-black/50 blur-sm"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dish.image}
            alt=""
            className="ar-float h-28 w-28 rounded-2xl border border-white/15 object-cover shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.7)]"
          />
        </div>

        <div className="absolute right-0 top-0 flex flex-col gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-foreground/80">
            <RotateCw className="h-3.5 w-3.5" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-foreground/80">
            <Move3d className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">{t("arHint")}</p>
    </div>
  );
}
