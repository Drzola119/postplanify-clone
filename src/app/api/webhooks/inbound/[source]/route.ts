import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/db";
import { createComment } from "@/lib/db/inbox";
import { inboxInboundSchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inbound webhook from external systems (n8n, upload-post.com polling, etc.).
 * Auth via `X-Webhook-Secret` (env WEBHOOK_INBOUND_SECRET). The caller also
 * supplies a `X-Workspace-Id` header so we know which workspace to attribute.
 *
 * Deduplicates on (workspaceId, source, externalId) when externalId is provided.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const secret = request.headers.get("x-webhook-secret");
  const expected = process.env.WEBHOOK_INBOUND_SECRET?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.headers.get("x-workspace-id")?.trim();
  if (!workspaceId) return jsonError(400, "Missing X-Workspace-Id header");
  if (!adminDb) return jsonError(503, "Database not configured");

  const { source } = await params;
  if (!/^[a-z0-9-]{1,32}$/.test(source)) {
    return jsonError(400, "Invalid source");
  }

  const parsed = await parseBody(request, inboxInboundSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  // Dedup: check existing doc with same externalId under this source's namespace.
  if (parsed.data.externalId) {
    const existing = await adminDb
      .collection(`webhookInbound/${workspaceId}/${source}`)
      .doc(parsed.data.externalId)
      .get();
    if (existing.exists) {
      return jsonOk({ duplicate: true, id: existing.id });
    }
    await adminDb
      .collection(`webhookInbound/${workspaceId}/${source}`)
      .doc(parsed.data.externalId)
      .set({ receivedAt: { _methodName: "serverTimestamp" } });
  }

  const id = await createComment(workspaceId, {
    platform: parsed.data.platform,
    postId: parsed.data.postId,
    authorHandle: parsed.data.authorHandle,
    body: parsed.data.body,
    sentAt: parsed.data.sentAt ? new Date(parsed.data.sentAt) : undefined,
  });

  return jsonOk({ id, source }, 201);
}
