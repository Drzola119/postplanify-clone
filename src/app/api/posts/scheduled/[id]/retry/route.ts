import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPost, updatePost } from "@/lib/db/posts";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";
import { parseBody } from "@/lib/validation/helpers";

const retrySchema = z.object({
  // Optional: caller can pick a scheduled time. Defaults to "right now".
  scheduledAt: z.string().datetime().optional(),
  // Reset the failure reason when retrying.
  clearReason: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await ctx.params;
  const post = await getPost(session.workspaceId, id);
  if (!post) return jsonError(404, "Post not found");

  if (post.status !== "failed" && post.status !== "paused") {
    return jsonError(409, `Cannot retry post in status "${post.status}"`);
  }

  const parsed = await parseBody(request, retrySchema);
  if (!parsed.ok) return jsonError(400, "Invalid retry payload", parsed.error.issues);

  const now = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : new Date();
  if (Number.isNaN(now.getTime())) return jsonError(400, "Invalid scheduledAt");

  const patch: Record<string, unknown> = {
    status: "scheduled",
    scheduledAt: now,
  };
  // Only patch failureReason when the caller asked us to clear it. Leaving it
  // alone preserves the debug trail in the history view.
  if (parsed.data.clearReason) {
    patch.failureReason = null;
  }
  await updatePost(session.workspaceId, id, patch as Parameters<typeof updatePost>[2]);

  return jsonOk({ id, status: "scheduled", scheduledAt: now.toISOString() });
}
