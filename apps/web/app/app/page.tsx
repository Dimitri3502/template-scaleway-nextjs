import { Card, EmptyState } from "@acme/ui";
import { NotebookPen } from "lucide-react";

import { AppHeader } from "../../components/layout/app-header";
import { NoteForm } from "../../components/notes/note-form";
import { NoteListItem } from "../../components/notes/note-list-item";
import { getTranslations } from "../../i18n";
import { requireUser } from "../../server/auth/access-context";
import { listNotes } from "../../server/services/notes";

/** Page RSC : elle appelle un service, jamais la base directement. */
export default async function NotesPage() {
  const t = getTranslations();
  const user = await requireUser();
  const notes = await listNotes(user.id);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface">
      <AppHeader title={t("notes.title")} />

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-safe-bottom">
        <NoteForm />

        {notes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen className="size-8" aria-hidden />}
            title={t("notes.empty.title")}
            description={t("notes.empty.body")}
          />
        ) : (
          <Card className="divide-y divide-border">
            {notes.map((note) => (
              <NoteListItem key={note.id} note={note} />
            ))}
          </Card>
        )}
      </main>
    </div>
  );
}
