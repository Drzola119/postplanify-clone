import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/db";
import { createComment, updateCommentSentiment } from "@/lib/db/inbox";
import { inboxInboundSchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { callGroq, extractJson, GROQ_TEXT_MODEL, GroqError } from "@/lib/ai/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SENTIMENT_SYSTEM_PROMPT =
  "You classify the sentiment of a social-media comment. " +
  "Return ONLY JSON of the form {\"sentiment\": \"positive\"|\"neutral\"|\"negative\"}. " +
  "Score is your confidence-weighted sentiment on a -1..1 axis.";

function classifySentiment(body: string, apiKey: string): Promise<"positive" | "neutral" | "negative"> {
  return callGroq({
    apiKey,
    model: GROQ_TEXT_MODEL,
    jsonMode: true,
    messages: [
      { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
      { role: "user", content: `Classify the sentiment of this comment:\n\n${body.slice(0, 3000)}` },
    ],
    maxTokens: 60,
    temperature: 0.3,
  })
    .then((r) => {
      const obj = extractJson<{ sentiment?: string }>(r.content);
      if (obj?.sentiment === "positive" || obj?.sentiment === "negative") return obj.sentiment;
      return "neutral" as const;
    })
    .catch(() => "neutral" as const);
}

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

  // Auto-classify sentiment in the background. We return 201 immediately so
  // the inbound caller doesn't have to wait on Groq. Failures fall back to
  // "neutral" and are silently logged — never block ingest.
  void (async () => {
    try {
      const apiKey = resolvers.groqApiKey(request.headers);
      const sentiment = await classifySentiment(parsed.data.body, apiKey);
      await updateCommentSentiment(workspaceId, id, sentiment);
    } catch (err) {
      if (err instanceof MissingServerSecretError) {
        console.warn("[inbound-webhook] GROQ_API_KEY not configured; skipping sentiment");
      } else if (err instanceof GroqError) {
        console.warn(`[inbound-webhook] Groq sentiment failed: ${err.message}`);
      } else {
        console.warn("[inbound-webhook] sentiment auto-classify error:", err);
      }
    }
  })();

  return jsonOk({ id, source }, 201);
}
