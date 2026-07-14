import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import { updateCommentSentiment } from "@/lib/db/inbox";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";
import { parseBody } from "@/lib/validation/helpers";

const patchSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  labels: z.array(z.string().min(1).max(32)).max(10).optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await ctx.params;
  const parsed = await parseBody(request, patchSchema);
  if (!parsed.ok) return jsonError(400, "Invalid patch", parsed.error.issues);
  const { sentiment, labels, archived } = parsed.data;

  if (sentiment) {
    await updateCommentSentiment(session.workspaceId, id, sentiment);
  }
  if (labels || typeof archived === "boolean") {
    if (!adminDb) return jsonError(503, "Database not configured");
    const ref = adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`);
    const patch: Record<string, unknown> = {};
    if (labels) patch.labels = labels;
    if (typeof archived === "boolean") {
      patch.archivedAt = archived ? new Date() : null;
    }
    await ref.update(patch);
  }
  return jsonOk({ id });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await ctx.params;
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`);
  await ref.update({ archivedAt: new Date() });
  return jsonOk({ id, archived: true });
}
