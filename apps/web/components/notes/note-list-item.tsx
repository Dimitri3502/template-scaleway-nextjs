import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatDay } from "../../lib/format";
import { routes } from "../../routes";
import type { NoteSummary } from "../../server/services/notes";

export function NoteListItem({ note }: { note: NoteSummary }) {
  return (
    <Link
      href={routes.note(note.id)}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-ink">{note.title}</p>
        <p className="text-sm text-ink-muted">{formatDay(note.createdAt)}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
    </Link>
  );
}
