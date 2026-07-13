import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { updateSet, deleteSet } from "@/lib/db/hashtags";
import { updateHashtagSetSchema } from "@/lib/validation/hashtags";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const parsed = await parseBody(request, updateHashtagSetSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await updateSet(session.workspaceId, id, parsed.data);
  return jsonOk({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  await deleteSet(session.workspaceId, id);
  return jsonOk({ id });
}
