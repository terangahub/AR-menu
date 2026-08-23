import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Résout l'utilisateur Clerk connecté vers son profil restaurant (section 18).
//
// Simplification Sprint 2 : il n'existe pas encore de flux d'onboarding ou
// d'invitation d'équipe (section 10.7, hors scope du sprint). Le premier
// compte Clerk qui visite le dashboard est donc automatiquement lié comme
// "owner" du restaurant de démo — à remplacer par un vrai flux d'invitation
// avant l'ouverture à plusieurs restaurants.
export async function getCurrentRestaurantUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  let user = await prisma.user.findFirst({
    where: { OR: [{ clerkUserId: clerkUser.id }, { email }] },
    include: { restaurant: true },
  });

  if (user && user.clerkUserId !== clerkUser.id) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { clerkUserId: clerkUser.id },
      include: { restaurant: true },
    });
  }

  if (!user) {
    const restaurant = await prisma.restaurant.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!restaurant) return null;

    user = await prisma.user.create({
      data: {
        email,
        clerkUserId: clerkUser.id,
        restaurantId: restaurant.id,
        role: "owner",
      },
      include: { restaurant: true },
    });
  }

  return user;
}
