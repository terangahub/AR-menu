import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes protégées : dashboard restaurateur (Owner/Staff) et super admin
// (SuperAdmin) — section 18 du cahier des charges. Le menu public (F01-F06)
// reste accessible sans authentification.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/superadmin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
