import { formatFileSize } from "@acme/shared";
import { Card } from "@acme/ui";
import { Paperclip } from "lucide-react";

import { getTranslations } from "../../i18n";
import { routes } from "../../routes";
import type { NoteAttachment } from "../../server/services/notes";

export function AttachmentList({ attachments }: { attachments: readonly NoteAttachment[] }) {
  const t = getTranslations();

  if (attachments.length === 0) {
    return <p className="text-sm text-ink-muted">{t("notes.attachments.empty")}</p>;
  }

  return (
    <Card className="divide-y divide-border">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={routes.api.attachmentAccess(attachment.id)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
        >
          <Paperclip className="size-5 shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{attachment.originalFilename}</p>
            <p className="text-sm text-ink-muted">{formatFileSize(attachment.size)}</p>
          </div>
        </a>
      ))}
    </Card>
  );
}
