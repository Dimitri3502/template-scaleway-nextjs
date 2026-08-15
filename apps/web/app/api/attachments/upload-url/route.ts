import { NextResponse } from "next/server";

import { requireUser } from "../../../../server/auth/access-context";
import { messageKeyForError } from "../../../../server/errors";
import { prepareUpload } from "../../../../server/services/attachments";

interface UploadUrlRequest {
  readonly noteId?: unknown;
  readonly originalFilename?: unknown;
  readonly mimeType?: unknown;
  readonly size?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Premier temps de l'envoi : le serveur génère l'identifiant et la clé S3, puis signe une
 * URL d'écriture à durée courte. Le binaire ne transite jamais par l'application.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = (await request.json()) as UploadUrlRequest;

    const prepared = await prepareUpload({
      ownerId: user.id,
      noteId: readString(payload.noteId),
      originalFilename: readString(payload.originalFilename),
      mimeType: readString(payload.mimeType),
      size: Number(payload.size),
    });

    return NextResponse.json(prepared);
  } catch (error) {
    return NextResponse.json({ error: messageKeyForError(error) }, { status: 400 });
  }
}
