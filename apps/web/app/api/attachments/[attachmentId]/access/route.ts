import { NextResponse } from "next/server";

import { requireUser } from "../../../../../server/auth/access-context";
import { createAttachmentAccessUrl } from "../../../../../server/services/attachments";

/**
 * Redirection vers une URL signée à durée courte. Aucune URL permanente n'existe : le
 * bucket est privé et l'appartenance est revérifiée à chaque accès.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;

  try {
    const user = await requireUser();
    const url = await createAttachmentAccessUrl(user.id, attachmentId);
    return NextResponse.redirect(url);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
