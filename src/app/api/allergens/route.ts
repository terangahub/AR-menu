import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/allergens - table de référence utilisée par le formulaire plat
// du dashboard (section 10.2) et le filtre du menu public (section 6.1).
// force-dynamic : sans paramètre d'URL, Next tenterait sinon de pré-générer
// cette route au build (donc de contacter la DB à ce moment-là).
export const dynamic = "force-dynamic";

export async function GET() {
  const allergens = await prisma.allergen.findMany({ orderBy: { nameFr: "asc" } });
  return NextResponse.json(allergens);
}
