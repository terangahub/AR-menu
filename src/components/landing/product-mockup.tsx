"use client";

import { useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Move3d,
  ShieldAlert,
} from "lucide-react";

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
// Reellement navigable a la demande du client : filtres de categorie,
// fiche complete de chaque plat (prix, description, allergenes), vue AR,
// retour en arriere, et defilement a l'interieur du cadre. Un apercu
// qu'on peut manipuler soi-meme convainc mieux qu'une image fixe.
//
// La vue AR reste une illustration (pas d'appareil photo, pas de vrai
// modele 3D charge ici) : elle montre ce que fait Vorae sans pretendre le
// faire elle-meme dans le hero.
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
  {
    key: "d5",
    image: "/hero-dish.jpg",
    price: "26,00 $",
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
type Dish = (typeof DISHES)[number];
// Les listes d'allergenes sont stockees en une seule chaine dans les
// fichiers de traduction, next-intl ne gerant pas les tableaux.
const ALLERGEN_SEPARATOR = " | ";

export function ProductMockup() {
  const t = useTranslations("Landing.mockup");
  const [category, setCategory] = useState<Category>("all");
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [arDish, setArDish] = useState<Dish | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const visibleDishes = DISHES.filter(
    (dish) => category === "all" || dish.category === category
  );

  // Legere inclinaison qui suit la souris, desktop seulement (aucun
  // `mousemove` ne se declenche au toucher) : donne au telephone un
  // relief 3D discret plutot qu'une image plate posee la. Neutralisee
  // des qu'un ecran interieur est ouvert : le telephone doit rester
  // stable pendant qu'on lit une fiche ou qu'on vise en AR.
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (openDish || arDish) return;
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
        // Pas de `transformStyle: preserve-3d` ici, malgre la rotation :
        // il ouvre un contexte de rendu 3D dans lequel le test de
        // collision des descendants devient faux. Symptome constate :
        // `mousedown` etait attribue au conteneur et `mouseup` au bouton,
        // le navigateur declenchait donc le `click` sur leur ancetre
        // commun et le bouton ne repondait jamais - alors que le meme
        // bouton reagissait a un clic declenche en JavaScript. La
        // rotation reste identique a l'oeil sans cette propriete, les
        // enfants etant simplement aplatis dans le plan du telephone.
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="relative h-[420px] overflow-hidden rounded-[2.45rem] bg-background sm:h-[460px]">
          {/* Encoche */}
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />

          {arDish ? (
            <ArView
              dish={arDish}
              label={t(arDish.key)}
              onBack={() => setArDish(null)}
            />
          ) : openDish ? (
            <DishDetail
              dish={openDish}
              onBack={() => setOpenDish(null)}
              onViewAr={() => setArDish(openDish)}
            />
          ) : (
            <MenuList
              dishes={visibleDishes}
              category={category}
              onCategory={setCategory}
              onOpenDish={setOpenDish}
            />
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">{t("tryHint")}</p>
    </div>
  );
}

// Ecran d'accueil : recherche, filtres, liste des plats. Le contenu
// defile a l'interieur du cadre (`overflow-y-auto`), comme sur un vrai
// telephone : la liste depasse volontairement la hauteur de l'ecran.
function MenuList({
  dishes,
  category,
  onCategory,
  onOpenDish,
}: {
  dishes: readonly Dish[];
  category: Category;
  onCategory: (value: Category) => void;
  onOpenDish: (dish: Dish) => void;
}) {
  const t = useTranslations("Landing.mockup");

  return (
    <div className="scrollbar-none h-full overflow-y-auto overscroll-contain px-4 pb-5 pt-9">
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

      {/* Barre de recherche factice : elle situe l'ecran sans promettre
          une recherche qui ne marcherait pas dans une maquette. */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
        <Search className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{t("search")}</span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {CATEGORIES.map(({ key, value }) => (
          <button
            key={key}
            type="button"
            onClick={() => onCategory(value)}
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

      <div className="mt-3 flex flex-col gap-2">
        {dishes.map((dish) => (
          <button
            key={dish.key}
            type="button"
            onClick={() => onOpenDish(dish)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
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
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[9px] font-medium text-primary ring-1 ring-primary/25">
                <Sparkles className="h-2.5 w-2.5" />
                AR
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Fiche plat : ce que voit reellement le convive apres avoir touche un
// plat. Photo en grand, prix, description, allergenes, et l'acces a la
// vue AR quand le plat en a une.
function DishDetail({
  dish,
  onBack,
  onViewAr,
}: {
  dish: Dish;
  onBack: () => void;
  onViewAr: () => void;
}) {
  const t = useTranslations("Landing.mockup");
  const allergens = t(`${dish.key}Allergens`).split(ALLERGEN_SEPARATOR);

  return (
    <div className="scrollbar-none h-full overflow-y-auto overscroll-contain">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dish.image} alt="" className="h-40 w-full object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/60"
        />
        <button
          type="button"
          onClick={onBack}
          className="absolute left-3 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md"
          aria-label={t("back")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* `relative` indispensable ici : ce bloc chevauche le bas de la
          photo via sa marge negative, et le conteneur de la photo est
          lui-meme `relative`. Sans position sur ce bloc, un element
          positionne passe devant un element statique quel que soit
          l'ordre du DOM : le nom du plat et le prix se retrouvaient
          caches derriere l'image. */}
      <div className="relative -mt-6 px-4 pb-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-medium leading-tight text-foreground">
            {t(dish.key)}
          </h3>
          <span className="shrink-0 font-heading text-base font-medium text-primary">
            {dish.price}
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t(`${dish.key}Desc`)}
        </p>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <ShieldAlert className="h-3 w-3" />
            {t("allergensLabel")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allergens.map((allergen) => (
              <span
                key={allergen}
                className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] text-foreground/80"
              >
                {allergen}
              </span>
            ))}
          </div>
        </div>

        {dish.ar ? (
          <button
            type="button"
            onClick={onViewAr}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("viewAr")}
          </button>
        ) : (
          // Un plat sans modele 3D le dit, plutot que d'afficher un
          // bouton qui ne ferait rien : c'est aussi le cas dans le vrai
          // produit, tous les plats ne sont pas modelises.
          <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-[10px] text-muted-foreground">
            {t("noAr")}
          </p>
        )}
      </div>
    </div>
  );
}

// Ecran affiché quand on demande la vue AR d'un plat : une illustration
// du produit (surface au sol, plat qui flotte au-dessus avec son ombre,
// reticule qui pulse), pas une vraie session AR - honnête sur ce qu'est
// le hero d'une page marketing.
function ArView({
  dish,
  label,
  onBack,
}: {
  dish: Dish;
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-foreground"
          aria-label={t("arBack")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="truncate text-xs font-medium text-foreground">{label}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-medium text-primary ring-1 ring-primary/25">
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
