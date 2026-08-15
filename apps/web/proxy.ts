import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { routes } from "./routes";

const isPublicRoute = createRouteMatcher([
  routes.home,
  `${routes.signIn}(.*)`,
  `${routes.signUp}(.*)`,
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les internes Next (le service worker et le
    // manifeste doivent rester accessibles hors session).
    "/((?!_next|sw\\.js|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
