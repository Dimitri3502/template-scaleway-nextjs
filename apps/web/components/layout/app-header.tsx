import { UserButton } from "@clerk/nextjs";

import { getTranslations } from "../../i18n";

export function AppHeader({ title }: { title: string }) {
  const t = getTranslations();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-raised px-4 py-3 pt-safe-top">
      <div className="min-w-0">
        <p className="font-display text-lg text-brand-700">{t("app.name")}</p>
        <h1 className="truncate text-sm text-ink-muted">{title}</h1>
      </div>
      <UserButton />
    </header>
  );
}
