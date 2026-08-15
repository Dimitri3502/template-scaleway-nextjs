import { buttonVariants } from "@acme/ui";
import { Check } from "lucide-react";
import Link from "next/link";

import { getTranslations } from "../i18n";
import { routes } from "../routes";

export default function LandingPage() {
  const t = getTranslations();
  const benefits = [
    t("landing.benefit.auth"),
    t("landing.benefit.data"),
    t("landing.benefit.files"),
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-10 px-6 py-12 pt-safe-top pb-safe-bottom">
      <div className="flex flex-col gap-4">
        <p className="font-display text-4xl tracking-tight text-brand-700">{t("app.name")}</p>
        <h1 className="text-2xl font-medium text-ink">{t("landing.tagline")}</h1>
        <p className="text-base text-ink-muted">{t("landing.intro")}</p>
      </div>

      <Link href={routes.app} className={buttonVariants({ size: "lg" })}>
        {t("landing.cta")}
      </Link>

      <ul className="flex flex-col gap-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-3 text-sm text-ink">
            <Check className="size-5 shrink-0 text-brand-600" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>
    </main>
  );
}
