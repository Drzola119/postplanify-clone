import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { revokeKey } from "@/lib/db/api-keys";
import { jsonOk } from "@/lib/validation/helpers";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  await revokeKey(session.workspaceId, id);
  return jsonOk({ id });
}
