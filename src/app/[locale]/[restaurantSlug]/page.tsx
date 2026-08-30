import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/scan";
import { MenuClient, type MenuDish } from "@/components/menu/menu-client";
import { LocaleSwitch } from "@/components/locale-switch";
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
    // Un QR code déjà imprimé encode l'ancienne adresse du menu dans son
    // image : si le restaurateur renomme son établissement, tous les
    // cartons collés sur les tables pointent vers une page qui n'existe
    // plus, et il n'y a aucun moyen de les corriger à distance. Le `?qr=`
    // qu'ils portent, lui, identifie le QR code de façon stable. On s'en
    // sert pour retrouver le restaurant et rediriger vers son adresse
    // actuelle, plutôt que de laisser un convive attablé sur un 404.
    if (qr) {
      const qrCode = await prisma.qrCode.findUnique({
        where: { id: qr },
        select: { restaurant: { select: { slug: true } } },
      });
      if (qrCode) {
        redirect({
          href: `/${qrCode.restaurant.slug}?qr=${encodeURIComponent(qr)}`,
          locale,
        });
      }
    }
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
        {/* Les commandes passent sur leur propre ligne, au-dessus. Elles
            partageaient auparavant la ligne du nom, qui n'avait donc plus
            que la moitié de la largeur : sur un téléphone, "Vorae Demo" se
            cassait en deux lignes sous le logo. Le nom dispose maintenant
            de toute la largeur et tient sur une ligne, avec le logo à sa
            gauche et la ville juste dessous. */}
        <header className="flex flex-col gap-5 pb-2 pt-6 sm:pt-10">
          <div className="flex items-center justify-end gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4">
            {restaurant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl border border-border/60 object-cover sm:h-16 sm:w-16"
              />
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              {/* `text-balance` et une taille qui démarre plus bas : un nom
                  long reste lisible sans jamais se casser en escalier. */}
              <h1 className="text-balance font-heading text-[26px] leading-none tracking-tight sm:text-4xl">
                {restaurant.name}
              </h1>
              <p className="text-sm text-muted-foreground">{restaurant.city}</p>
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

        {/* La mention de marque est aussi le seul lien commercial de tout
            le menu : un convive qui la remarque est un prospect, et il
            n'avait jusqu'ici aucun moyen d'aller voir ce qu'est Vorae.
            Nouvel onglet volontaire : le convive est au milieu de son
            repas, quitter le menu lui ferait perdre sa place et le
            rattachement de sa visite à sa table. */}
        <footer className="mt-16 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          {t.rich("poweredBy", {
            vorae: (chunks) => (
              <a
                href="/"
                target="_blank"
                rel="noopener"
                className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                {chunks}
              </a>
            ),
          })}
        </footer>
      </main>
    </div>
  );
}
