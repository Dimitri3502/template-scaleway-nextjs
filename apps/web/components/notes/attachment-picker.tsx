"use client";

import type { ActionState } from "@acme/shared";
import { ACCEPTED_MIME_TYPES_ATTRIBUTE, IDLE_ACTION_STATE } from "@acme/shared";
import { Alert, Button } from "@acme/ui";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { getTranslations } from "../../i18n";
import { routes } from "../../routes";
import { confirmAttachmentAction } from "../../server/actions/notes";

interface PreparedUpload {
  readonly attachmentId: string;
  readonly objectKey: string;
  readonly uploadUrl: string;
}

/**
 * Envoi en deux temps : le serveur signe une URL d'écriture, le navigateur envoie le binaire
 * directement au bucket, puis le serveur confirme après avoir recalculé la clé attendue.
 * Le fichier ne traverse jamais l'application.
 */
export function AttachmentPicker({ noteId }: { noteId: string }) {
  const t = getTranslations();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>(IDLE_ACTION_STATE);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setUploading(true);
    setState(IDLE_ACTION_STATE);

    try {
      const response = await fetch(routes.api.attachmentUploadUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          noteId,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!response.ok) throw new Error("Failed to prepare upload");
      const prepared = (await response.json()) as PreparedUpload;

      const put = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Failed to upload file");

      const formData = new FormData();
      formData.set("noteId", noteId);
      formData.set("attachmentId", prepared.attachmentId);
      formData.set("objectKey", prepared.objectKey);
      formData.set("originalFilename", file.name);
      formData.set("mimeType", file.type);
      formData.set("size", String(file.size));

      const confirmed = await confirmAttachmentAction(IDLE_ACTION_STATE, formData);
      setState(confirmed);
      if (confirmed.status === "success") startTransition(() => router.refresh());
    } catch {
      setState({ status: "error", message: t("error.uploadFailed"), fieldErrors: {} });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES_ATTRIBUTE}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <Button variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Paperclip className="size-4" aria-hidden />
        {uploading ? t("notes.attachments.uploading") : t("notes.attachments.add")}
      </Button>

      {state.status === "error" ? <Alert tone="danger">{state.message}</Alert> : null}
    </div>
  );
}
