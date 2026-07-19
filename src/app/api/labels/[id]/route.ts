import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { updateLabel, deleteLabel } from "@/lib/db/labels";
import { updateLabelSchema } from "@/lib/validation/labels";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const parsed = await parseBody(request, updateLabelSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await updateLabel(session.workspaceId, id, parsed.data);
  return jsonOk({ success: true });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  await deleteLabel(session.workspaceId, id);
  return jsonOk({ success: true });
}
