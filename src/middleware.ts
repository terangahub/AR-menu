import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Routes protégées : dashboard restaurateur (Owner/Staff) et super admin
// (SuperAdmin) — section 18 du cahier des charges. Le menu public (F01-F06)
// reste accessible sans authentification.
const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/:locale/superadmin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return handleI18nRouting(req);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mov|mp3)).*)",
    "/(api|trpc)(.*)",
  ],
};
