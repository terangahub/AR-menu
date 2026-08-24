import { useTranslations } from "next-intl";
import { Sparkles, Search } from "lucide-react";

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
const DISHES = [
  { key: "d1", image: "/dish-signature-bowl.jpg", price: "18,50 $", ar: true },
  { key: "d2", image: "/dish-salad.jpg", price: "22,00 $", ar: true },
  { key: "d3", image: "/dish-pasta.jpg", price: "16,00 $", ar: false },
];

export function ProductMockup() {
  const t = useTranslations("Landing.mockup");

  return (
    <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]">
      {/* Chassis du telephone */}
      <div className="relative rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-white/20 to-white/5 p-[3px] shadow-[0_40px_120px_-20px_hsl(var(--secondary)),0_0_60px_-20px_hsl(var(--primary)/0.6)]">
        <div className="relative overflow-hidden rounded-[2.45rem] bg-background">
          {/* Encoche */}
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />

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

            {/* Filtres de categorie */}
            <div className="mt-3 flex gap-1.5">
              {["catAll", "catMains", "catStarters"].map((key, i) => (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-1 text-[10px] ${
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/10 text-muted-foreground"
                  }`}
                >
                  {t(key)}
                </span>
              ))}
            </div>

            {/* Liste de plats */}
            <div className="mt-3 flex flex-col gap-2">
              {DISHES.map((dish) => (
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
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[9px] font-medium text-primary ring-1 ring-primary/25">
                      <Sparkles className="h-2.5 w-2.5" />
                      AR
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
