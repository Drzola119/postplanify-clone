import "server-only";
import { createHmac } from "node:crypto";
import type { PlatformId } from "@/lib/db/schema";
import { listDestinations, getDestinationSecret, markDestinationDelivered, incrementConsecutiveFailures, resetConsecutiveFailures } from "@/lib/db/destinations";
import { createLogger } from "@/lib/log";

const log = createLogger("webhook-delivery");

export interface DeliveryResult {
  url: string;
  success: boolean;
  attempts: number;
  status?: number;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  workspaceId: string;
  data: Record<string, unknown>;
}

/**
 * Outbound reply payload published to n8n (and any other subscribed
 * webhook). n8n fans this out to the per-platform connector.
 *
 * Expected n8n workflow (documented in queue/automation-worker.ts):
 *   - HTTP Webhook node receives this JSON
 *   - Switch on `platform` to the right connector
 *   - For "twitter"/"bluesky": call the platform's reply API
 *   - For "instagram": call upload-post.com's comment-reply endpoint
 *   - For facebook/threads: call Meta Graph API reply
 *   - Return { "ok": true, "externalReplyId": "..." } on success
 */
export interface OutboundReplyPayload {
  workspaceId: string;
  platform: PlatformId;
  type: "comment-reply" | "dm-reply";
  originalExternalId: string;
  authorHandle: string;
  replyBody: string;
  campaignId: string;
  metadata?: Record<string, unknown>;
}

/** Sign the payload body with HMAC-SHA256 using the webhook's secret. */
export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

const DEFAULT_RETRY_DELAYS_MS = [0, 2_000, 8_000];

export interface DeliverOptions {
  fetchImpl?: typeof fetch;
  retryDelaysMs?: number[];
}

/**
 * Deliver an event to all active webhooks in a workspace that subscribe to it.
 * Best-effort: 3 retries with exponential backoff. Returns a per-url result.
 */
export async function deliverWebhook(
  workspaceId: string,
  payload: WebhookPayload,
  options: DeliverOptions = {}
): Promise<DeliveryResult[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const destinations = await listDestinations(workspaceId);
  const subscribed = destinations.filter((d) => d.active && d.events.includes(payload.event));

  return Promise.all(
    subscribed.map(async (d) => {
      const body = JSON.stringify(payload);
      const secret = (await getDestinationSecret(workspaceId, d.id)) ?? "";
      const signature = signPayload(body, secret);
      let lastError: string | undefined;
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < retryDelays.length; attempt++) {
        if (retryDelays[attempt] > 0) {
          await new Promise((r) => setTimeout(r, retryDelays[attempt]));
        }
        try {
          const res = await fetchImpl(d.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-PostPlanify-Signature": signature,
              "X-PostPlanify-Event": payload.event,
              "X-Webhook-Id": d.id,
            },
            body,
          });
          if (res.ok) {
            await markDestinationDelivered(workspaceId, d.id);
            await resetConsecutiveFailures(workspaceId, d.id);
            return { url: d.url, success: true, attempts: attempt + 1, status: res.status };
          }
          lastStatus = res.status;
          lastError = `HTTP ${res.status}`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      log.warn("webhook delivery failed", {
        destinationId: d.id,
        url: d.url,
        event: payload.event,
        workspaceId,
        error: lastError,
        status: lastStatus,
        attempts: retryDelays.length,
      });
      await incrementConsecutiveFailures(workspaceId, d.id);
      return {
        url: d.url,
        success: false,
        attempts: retryDelays.length,
        status: lastStatus,
        error: lastError,
      };
    })
  );
}

/**
 * Send an outbound auto-reply via n8n. n8n fans out to the per-platform
 * connector and returns { ok, externalReplyId }.
 */
export async function deliverInboxReply(
  workspaceId: string,
  reply: OutboundReplyPayload,
  options: DeliverOptions = {},
): Promise<DeliveryResult[]> {
  const event = reply.type === "comment-reply" ? "inbox.reply" : "inbox.dm-reply";
  return deliverWebhook(workspaceId, { event, workspaceId, data: reply as unknown as Record<string, unknown> }, options);
}
