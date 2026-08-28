import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/scan";
import { MenuClient, type MenuDish } from "@/components/menu/menu-client";
import { LocaleSwitch } from "@/components/menu/locale-switch";
import { ThemeToggle } from "@/components/theme-toggle";

// Menu 2D public (F02) - fallback obligatoire, jamais bloqué par l'AR
// (section 5.1, 17.1). GET /api/menu/[restaurantSlug] expose les mêmes
// données pour d'autres clients (section 9.1).
export default async function RestaurantMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; restaurantSlug: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { locale, restaurantSlug } = await params;
  const { qr } = await searchParams;
  const t = await getTranslations("Menu");

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      city: true,
      dishes: {
        where: { isAvailable: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          descriptionEn: true,
          category: true,
          categoryEn: true,
          price: true,
          imageUrl: true,
          isArReady: true,
          allergens: {
            select: {
              allergen: { select: { code: true, nameFr: true, nameEn: true } },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  if (qr) {
    // Best-effort - un QR code invalide ou une limite de débit atteinte ne
    // doit jamais empêcher l'affichage du menu.
    await recordScan({ qrCodeId: qr }).catch(() => undefined);
  }

  const dishes: MenuDish[] = restaurant.dishes.map((d) => ({
    ...d,
    price: Number(d.price),
    allergens: d.allergens.map((a) => a.allergen),
  }));

  const arCount = dishes.filter((d) => d.isArReady).length;

  return (
    <div className="relative min-h-screen">
      {/* Halo d'ambiance cantonné au haut de page : il habille l'en-tête
          sans jamais passer derrière les photos de plats, qui doivent
          rester le seul point d'attention coloré. */}
      <div
        aria-hidden
        className="menu-aurora pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />

      <main className="relative mx-auto flex max-w-5xl flex-col px-4 pb-20 sm:px-6">
        <header className="flex flex-col gap-6 pb-2 pt-8 sm:pt-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {restaurant.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl border border-border/60 object-cover sm:h-16 sm:w-16"
                />
              )}
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
                  {restaurant.name}
                </h1>
                <p className="text-sm text-muted-foreground">{restaurant.city}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LocaleSwitch />
              <ThemeToggle />
            </div>
          </div>

          {/* Annoncé une seule fois, en tête : le convive comprend d'emblée
              ce que le cube des vignettes signifie, plutôt que de le
              découvrir plat par plat. */}
          {arCount > 0 && (
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {t("arIntro", { count: arCount })}
            </p>
          )}
        </header>

        <MenuClient
          restaurantSlug={restaurantSlug}
          dishes={dishes}
          locale={locale}
          qr={qr}
        />

        <footer className="mt-16 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          {t("poweredBy")}
        </footer>
      </main>
    </div>
  );
}
