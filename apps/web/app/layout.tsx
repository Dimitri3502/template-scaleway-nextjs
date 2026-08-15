import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { PwaUpdateManager } from "../components/pwa/pwa-update-manager";
import { getTranslations } from "../i18n";
import { routes } from "../routes";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-app-display",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const t = getTranslations();
  return {
    title: t("app.name"),
    description: t("app.description"),
    manifest: routes.manifest,
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("app.name") },
  };
}

export const viewport: Viewport = {
  themeColor: "#157c72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr" className={`${sans.variable} ${display.variable}`}>
        <body className="min-h-dvh">
          {children}
          <PwaUpdateManager />
        </body>
      </html>
    </ClerkProvider>
  );
}
