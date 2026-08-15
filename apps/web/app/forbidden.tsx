import { buttonVariants } from "@acme/ui";
import Link from "next/link";

import { getTranslations } from "../i18n";
import { routes } from "../routes";

export default function Forbidden() {
  const t = getTranslations();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-2xl text-brand-700">{t("app.name")}</p>
      <p className="text-base text-ink">{t("error.forbidden")}</p>
      <Link href={routes.app} className={buttonVariants({ size: "sm" })}>
        {t("common.back")}
      </Link>
    </main>
  );
}
