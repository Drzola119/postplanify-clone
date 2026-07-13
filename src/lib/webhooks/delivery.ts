import "server-only";
import { createHmac } from "node:crypto";
import { listWebhooks, markDelivered, getWebhookSecret } from "@/lib/db/webhooks";

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
  const webhooks = await listWebhooks(workspaceId);
  const subscribed = webhooks.filter((w) => w.active && w.events.includes(payload.event));

  return Promise.all(
    subscribed.map(async (w) => {
      const body = JSON.stringify(payload);
      const secret = (await getWebhookSecret(workspaceId, w.id)) ?? "";
      const signature = signPayload(body, secret);
      let lastError: string | undefined;
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < retryDelays.length; attempt++) {
        if (retryDelays[attempt] > 0) {
          await new Promise((r) => setTimeout(r, retryDelays[attempt]));
        }
        try {
          const res = await fetchImpl(w.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-PostPlanify-Signature": signature,
              "X-PostPlanify-Event": payload.event,
              "X-Webhook-Id": w.id,
            },
            body,
          });
          if (res.ok) {
            await markDelivered(workspaceId, w.id);
            return { url: w.url, success: true, attempts: attempt + 1, status: res.status };
          }
          lastStatus = res.status;
          lastError = `HTTP ${res.status}`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      return {
        url: w.url,
        success: false,
        attempts: retryDelays.length,
        status: lastStatus,
        error: lastError,
      };
    })
  );
}
