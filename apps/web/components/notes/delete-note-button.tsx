"use client";

import { IDLE_ACTION_STATE } from "@acme/shared";
import { Button } from "@acme/ui";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { getTranslations } from "../../i18n";
import { routes } from "../../routes";
import { deleteNoteAction } from "../../server/actions/notes";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const t = getTranslations();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteNoteAction, IDLE_ACTION_STATE);

  useEffect(() => {
    if (state.status === "success") router.replace(routes.app);
  }, [state, router]);

  return (
    <form action={formAction} className="mt-auto">
      <input type="hidden" name="noteId" value={noteId} />
      <Button type="submit" variant="danger" size="lg" disabled={pending}>
        {t("common.delete")}
      </Button>
    </form>
  );
}
