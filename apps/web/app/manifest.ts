import type { MetadataRoute } from "next";

import { getTranslations } from "../i18n";
import { routes } from "../routes";

/** Servi sur /manifest.webmanifest par Next. */
export default function manifest(): MetadataRoute.Manifest {
  const t = getTranslations();

  return {
    name: t("app.name"),
    short_name: t("app.name"),
    description: t("app.description"),
    start_url: routes.app,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f7",
    theme_color: "#157c72",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
