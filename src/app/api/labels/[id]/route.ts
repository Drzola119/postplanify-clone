import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { updateLabel, deleteLabel } from "@/lib/db/labels";
import { updateLabelSchema } from "@/lib/validation/labels";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const parsed = await parseBody(request, updateLabelSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await updateLabel(session.workspaceId, id, parsed.data);
  return jsonOk({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  await deleteLabel(session.workspaceId, id);
  return jsonOk({ id });
}
