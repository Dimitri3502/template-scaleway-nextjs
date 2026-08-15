"use client";

import { IDLE_ACTION_STATE } from "@acme/shared";
import { Alert, Button, Card, Field, Input, Textarea } from "@acme/ui";
import { useActionState, useEffect, useRef } from "react";

import { getTranslations } from "../../i18n";
import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from "../../lib/notes-constraints";
import { createNoteAction } from "../../server/actions/notes";

/**
 * `useActionState` consomme l'`ActionState` renvoyé par l'action : message global d'un côté,
 * erreurs par champ de l'autre. Aucun state manager, aucun client HTTP.
 */
export function NoteForm() {
  const t = getTranslations();
  const [state, formAction, pending] = useActionState(createNoteAction, IDLE_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <Card className="p-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <p className="text-base font-medium text-ink">{t("notes.new.title")}</p>

        <Field htmlFor="title" label={t("notes.field.title")} error={state.fieldErrors.title}>
          <Input id="title" name="title" maxLength={NOTE_TITLE_MAX_LENGTH} required />
        </Field>

        <Field htmlFor="body" label={t("notes.field.body")} error={state.fieldErrors.body}>
          <Textarea id="body" name="body" rows={3} maxLength={NOTE_BODY_MAX_LENGTH} />
        </Field>

        {state.status === "error" && Object.keys(state.fieldErrors).length === 0 ? (
          <Alert tone="danger">{state.message}</Alert>
        ) : null}

        <Button type="submit" disabled={pending}>
          {t("notes.create")}
        </Button>
      </form>
    </Card>
  );
}
