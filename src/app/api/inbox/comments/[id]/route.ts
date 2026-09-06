import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canWrite } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/db";
import { updateCommentSentiment } from "@/lib/db/inbox";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";
import { parseBody } from "@/lib/validation/helpers";

const patchSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  labels: z.array(z.string().min(1).max(32)).max(10).optional(),
  archived: z.boolean().optional(),
  /** Shared read state (grill decision: shared, not personal). */
  read: z.boolean().optional(),
  /** Resolution is separate from delivery (grill decision). */
  resolved: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");

  const { id } = await ctx.params;
  const parsed = await parseBody(request, patchSchema);
  if (!parsed.ok) return jsonError(400, "Invalid patch", parsed.error.issues);
  const { sentiment, labels, archived, read, resolved } = parsed.data;
  if (!adminDb) return jsonError(503, "Database not configured");

  // Sentiment edits are persisted with provenance (manual) — never presented
  // as external moderation (spec §10).
  if (sentiment) {
    await updateCommentSentiment(session.workspaceId, id, sentiment);
    await adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`).update({ sentimentSource: "manual" });
  }
  const patch: Record<string, unknown> = {};
  if (labels) patch.labels = labels;
  if (typeof archived === "boolean") patch.archivedAt = archived ? new Date() : null;
  if (typeof read === "boolean") patch.read = read;
  if (typeof resolved === "boolean") {
    patch.resolved = resolved;
    patch.resolvedAt = resolved ? new Date() : null;
    patch.resolvedBy = resolved ? session.uid : null;
  }
  if (Object.keys(patch).length > 0) {
    await adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`).update(patch);
  }
  return jsonOk({ id });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  // Local archive only — explicit in the response so the UI never labels it
  // as an external comment deletion (spec §10).
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await ctx.params;
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`);
  await ref.update({ archivedAt: new Date() });
  return jsonOk({ id, archived: true, scope: "local" });
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(401, "Unauthorized");
  if (!adminDb) return jsonError(503, "Database not configured");
  const { id } = await ctx.params;
  const snap = await adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`).get();
  if (!snap.exists) return jsonError(404, "Comment not found");
  return jsonOk({ id, ...snap.data() });
}
