import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getDraft, saveDraft, deleteDraft } from "@/lib/db/drafts";
import { updateDraftSchema } from "@/lib/validation/drafts";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const draft = await getDraft(session.workspaceId, id);
  if (!draft) return jsonError(404, "Draft not found");
  return jsonOk({ draft });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const parsed = await parseBody(request, updateDraftSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await saveDraft(session.workspaceId, session.uid, { ...parsed.data, id });
  return jsonOk({ id });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  await deleteDraft(session.workspaceId, id);
  return jsonOk({ id, deleted: true });
}