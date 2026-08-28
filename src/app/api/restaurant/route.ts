import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { qrTargetPath } from "@/lib/qr-target";

export const dynamic = "force-dynamic";

// Un identifiant d'adresse doit rester lisible et tapable à la main : il
// finit imprimé sous un QR code, et un convive peut avoir à le retaper.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(60)
    .regex(SLUG_PATTERN),
  city: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  defaultLocale: z.enum(routing.locales),
});

// GET/PATCH /api/restaurant - fiche du restaurant du compte connecté
// (section 10.5). Jusqu'ici le nom, la ville et le logo n'étaient
// modifiables qu'en base : un restaurateur qui changeait d'enseigne ou de
// logo n'avait aucun recours dans le produit.
export async function GET() {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, slug, city, email, logoUrl, defaultLocale } =
    restaurantUser.restaurant;
  return NextResponse.json({ id, name, slug, city, email, logoUrl, defaultLocale });
}

export async function PATCH(req: NextRequest) {
  const restaurantUser = await getCurrentRestaurantUser();
  if (!restaurantUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, slug, city, email, defaultLocale } = parsed.data;
  const restaurantId = restaurantUser.restaurantId;
  const slugChanged = slug !== restaurantUser.restaurant.slug;
  const localeChanged = defaultLocale !== restaurantUser.restaurant.defaultLocale;

  try {
    // Toutes les écritures dans la même transaction : une adresse de menu
    // changée sans que les QR codes suivent produirait des QR codes qui
    // pointent vers une page inexistante, et l'inverse des QR codes qui
    // pointent vers une adresse pas encore prise.
    //
    // Cette reconstruction ne répare que les QR codes réimprimés après le
    // changement. Ceux déjà collés sur les tables encodent l'ancienne
    // adresse dans leur image et ne peuvent pas être modifiés à distance :
    // c'est le repli par `?qr=` de la page de menu qui les rattrape (voir
    // [locale]/[restaurantSlug]/page.tsx).
    const [restaurant] = await prisma.$transaction([
      prisma.restaurant.update({
        where: { id: restaurantId },
        data: { name, slug, city, email, defaultLocale },
      }),
      ...(slugChanged || localeChanged
        ? [
            // Le préfixe vient du même helper que la génération d'un QR
            // code neuf (id vide), pour que les deux chemins ne puissent
            // pas diverger : ici seul l'id, déjà en base, est concaténé.
            prisma.$executeRaw`
              UPDATE "QrCode"
              SET "targetUrl" = ${qrTargetPath(defaultLocale, slug, "")} || "id"
              WHERE "restaurantId" = ${restaurantId}
            `,
          ]
        : []),
    ]);

    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      city: restaurant.city,
      email: restaurant.email,
      logoUrl: restaurant.logoUrl,
      defaultLocale: restaurant.defaultLocale,
      slugChanged,
      qrCodesUpdated: slugChanged || localeChanged,
    });
  } catch (err) {
    // P2002 : contrainte d'unicité. Le slug est la seule colonne unique
    // touchée ici, et le message doit être actionnable, pas un 500 muet.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    throw err;
  }
}
