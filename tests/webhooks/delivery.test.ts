import { describe, it, expect, vi } from "vitest";
import { signPayload, deliverWebhook, type WebhookPayload } from "@/lib/webhooks/delivery";
import { createHmac } from "node:crypto";

describe("webhooks/delivery - signPayload", () => {
  it("produces a deterministic HMAC-SHA256 hex digest", () => {
    const body = '{"event":"post.published"}';
    const secret = "super-secret-key";
    const sig = signPayload(body, secret);
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    expect(sig).toBe(expected);
  });

  it("different body or secret yields different signature", () => {
    const a = signPayload("a", "k");
    const b = signPayload("b", "k");
    const c = signPayload("a", "k2");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("webhooks/delivery - deliverWebhook", () => {
  it("returns empty when no webhooks match the event", async () => {
    const mockList = vi.fn(async () => []);
    vi.resetModules();
    vi.doMock("@/lib/db/webhooks", () => ({
      listWebhooks: mockList,
      markDelivered: vi.fn(),
      getWebhookSecret: vi.fn(),
    }));
    const { deliverWebhook: deliver } = await import("@/lib/webhooks/delivery");
    const result = await deliver("ws1", { event: "post.published", workspaceId: "ws1", data: {} });
    expect(result).toEqual([]);
  });

  it("signs payload and POSTs to subscribed active webhooks", async () => {
    const secret = "shared-secret";
    vi.resetModules();
    vi.doMock("@/lib/db/webhooks", () => ({
      listWebhooks: vi.fn(async () => [
        {
          id: "w1",
          url: "https://hook.example.com/h",
          events: ["post.published"],
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]),
      markDelivered: vi.fn(async () => undefined),
      getWebhookSecret: vi.fn(async () => secret),
    }));

    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    const payload: WebhookPayload = { event: "post.published", workspaceId: "ws1", data: { x: 1 } };
    const { deliverWebhook: deliver } = await import("@/lib/webhooks/delivery");
    const results = await deliver("ws1", payload, {
      fetchImpl: fetchMock as unknown as typeof fetch,
      retryDelaysMs: [0],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://hook.example.com/h");
    const headers = init.headers as Record<string, string>;
    const expectedSig = createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    expect(headers["X-PostPlanify-Signature"]).toBe(expectedSig);
    expect(headers["X-PostPlanify-Event"]).toBe("post.published");
    expect(results[0].success).toBe(true);
  });

  it("retries up to 3 times on failure and reports success=false", async () => {
    const secret = "s";
    vi.resetModules();
    vi.doMock("@/lib/db/webhooks", () => ({
      listWebhooks: vi.fn(async () => [
        {
          id: "w1",
          url: "https://hook.example.com/h",
          events: ["post.failed"],
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]),
      markDelivered: vi.fn(),
      getWebhookSecret: vi.fn(async () => secret),
    }));

    const fetchMock = vi.fn(async () => new Response("nope", { status: 503 }));
    const { deliverWebhook: deliver } = await import("@/lib/webhooks/delivery");
    const results = await deliver(
      "ws1",
      { event: "post.failed", workspaceId: "ws1", data: {} },
      { fetchImpl: fetchMock as unknown as typeof fetch, retryDelaysMs: [0, 0, 0] }
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(results[0].success).toBe(false);
    expect(results[0].status).toBe(503);
  });
});
