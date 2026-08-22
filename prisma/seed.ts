import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Modèles 3D d'exemple hébergés publiquement par le projet model-viewer
// (Google) — utilisés uniquement pour valider le pipeline AR pendant le
// Sprint 1. À remplacer par de vraies captures de plats (section 16).
const SAMPLE_MODELS = {
  astronaut: {
    glb: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    usdz: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
  },
  robot: {
    glb: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    usdz: undefined,
  },
};

async function main() {
  const allergenDefs = [
    { code: "gluten", nameFr: "Gluten", nameEn: "Gluten" },
    { code: "peanuts", nameFr: "Arachides", nameEn: "Peanuts" },
    { code: "shellfish", nameFr: "Crustacés", nameEn: "Shellfish" },
    { code: "dairy", nameFr: "Lait", nameEn: "Dairy" },
  ];

  const allergens = await Promise.all(
    allergenDefs.map((a) =>
      prisma.allergen.upsert({
        where: { code: a.code },
        update: {},
        create: a,
      })
    )
  );
  const allergenByCode = Object.fromEntries(
    allergens.map((a) => [a.code, a])
  );

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "vorae-demo" },
    update: {},
    create: {
      name: "Vorae Demo",
      slug: "vorae-demo",
      city: "Montréal",
      email: "demo@vorae.app",
      defaultLocale: "fr",
    },
  });

  const dishes = [
    {
      name: "Bol signature",
      nameEn: "Signature bowl",
      description: "Notre plat vedette, présenté en réalité augmentée.",
      category: "Plats",
      ingredients: "Riz, poulet mariné, légumes grillés, sauce maison",
      prepTimeMinutes: 15,
      price: 18.5,
      model: SAMPLE_MODELS.astronaut,
      allergenCodes: ["gluten", "dairy"],
    },
    {
      name: "Assiette du chef",
      nameEn: "Chef's plate",
      description: "Une composition qui change chaque semaine.",
      category: "Plats",
      ingredients: "Selon arrivage — voir avec votre serveur",
      prepTimeMinutes: 20,
      price: 24.0,
      model: SAMPLE_MODELS.robot,
      allergenCodes: ["shellfish"],
    },
    {
      name: "Entrée classique",
      nameEn: "Classic starter",
      description: "Un plat simple, sans modèle 3D pour l'instant.",
      category: "Entrées",
      ingredients: "Salade, vinaigrette, croûtons",
      prepTimeMinutes: 5,
      price: 9.0,
      model: null,
      allergenCodes: [],
    },
  ];

  for (const d of dishes) {
    const dish = await prisma.dish.create({
      data: {
        restaurantId: restaurant.id,
        name: d.name,
        nameEn: d.nameEn,
        description: d.description,
        category: d.category,
        ingredients: d.ingredients,
        prepTimeMinutes: d.prepTimeMinutes,
        price: d.price,
        model3dGlbUrl: d.model?.glb,
        model3dUsdzUrl: d.model?.usdz,
        isArReady: Boolean(d.model),
      },
    });

    for (const code of d.allergenCodes) {
      await prisma.dishAllergen.create({
        data: { dishId: dish.id, allergenId: allergenByCode[code].id },
      });
    }
  }

  await prisma.qrCode.upsert({
    where: { id: "seed-qr-table-1" },
    update: {},
    create: {
      id: "seed-qr-table-1",
      restaurantId: restaurant.id,
      tableNumber: "1",
      targetUrl: `/fr/${restaurant.slug}?qr=seed-qr-table-1`,
    },
  });

  console.log(`Seeded restaurant "${restaurant.slug}" with ${dishes.length} dishes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
