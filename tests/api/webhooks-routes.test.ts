import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const SESSION = { uid: "u1", email: "u1@test", workspaceId: "ws1" };

vi.mock("@/lib/firebase/admin", () => ({
  adminApp: { name: "mock" },
  adminAuth: null,
  adminDb: (globalThis as unknown as { __mockFs: MockFirestore }).__mockFs,
  SESSION_COOKIE: "pp_session",
  SESSION_MAX_AGE_MS: 432000000,
  createSessionCookie: vi.fn(async () => null),
  verifySessionCookie: vi.fn(async () => null),
  getCurrentUser: vi.fn(async () => null),
}));

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: vi.fn(async () => SESSION),
}));

const WEBHOOK_INBOUND_SECRET = "test-inbound-secret";
process.env.WEBHOOK_INBOUND_SECRET = WEBHOOK_INBOUND_SECRET;

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
});

function makeRequest(url: string, body?: unknown, method = "GET", headers: Record<string, string> = {}): Request {
  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

describe("api/webhooks - GET", () => {
  it("returns empty list", async () => {
    const { GET } = await import("@/app/api/webhooks/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webhooks).toEqual([]);
  });
});

describe("api/webhooks - POST", () => {
  it("creates a webhook and returns 201", async () => {
    const { POST } = await import("@/app/api/webhooks/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks",
        {
          url: "https://hook.example.com/h",
          events: ["post.published"],
          secret: "abcdefghij",
        },
        "POST"
      ) as never
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });

  it("rejects empty events", async () => {
    const { POST } = await import("@/app/api/webhooks/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks",
        { url: "https://hook.example.com/h", events: [], secret: "abcdefghij" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it("rejects short secret", async () => {
    const { POST } = await import("@/app/api/webhooks/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks",
        { url: "https://hook.example.com/h", events: ["post.published"], secret: "abc" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(400);
  });
});

describe("api/webhooks/inbound/[source] - POST", () => {
  it("rejects missing secret", async () => {
    const { POST } = await import("@/app/api/webhooks/inbound/[source]/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks/inbound/n8n",
        { platform: "twitter", authorHandle: "alice", body: "x" },
        "POST",
        { "x-workspace-id": "ws1" }
      ) as never,
      { params: Promise.resolve({ source: "n8n" }) }
    );
    expect(res.status).toBe(401);
  });

  it("rejects missing workspace id", async () => {
    const { POST } = await import("@/app/api/webhooks/inbound/[source]/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks/inbound/n8n",
        { platform: "twitter", authorHandle: "alice", body: "x" },
        "POST",
        { "x-webhook-secret": WEBHOOK_INBOUND_SECRET }
      ) as never,
      { params: Promise.resolve({ source: "n8n" }) }
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid source", async () => {
    const { POST } = await import("@/app/api/webhooks/inbound/[source]/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks/inbound/BAD",
        { platform: "twitter", authorHandle: "alice", body: "x" },
        "POST",
        { "x-webhook-secret": WEBHOOK_INBOUND_SECRET, "x-workspace-id": "ws1" }
      ) as never,
      { params: Promise.resolve({ source: "BAD" }) }
    );
    expect(res.status).toBe(400);
  });

  it("accepts valid payload and creates comment", async () => {
    const { POST } = await import("@/app/api/webhooks/inbound/[source]/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/webhooks/inbound/n8n",
        { platform: "twitter", authorHandle: "alice", body: "hello" },
        "POST",
        { "x-webhook-secret": WEBHOOK_INBOUND_SECRET, "x-workspace-id": "ws1" }
      ) as never,
      { params: Promise.resolve({ source: "n8n" }) }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.source).toBe("n8n");
  });

  it("deduplicates by externalId", async () => {
    const { POST } = await import("@/app/api/webhooks/inbound/[source]/route");
    const payload = {
      platform: "twitter" as const,
      authorHandle: "alice",
      body: "spam",
      externalId: "ext-123",
    };
    const headers = {
      "x-webhook-secret": WEBHOOK_INBOUND_SECRET,
      "x-workspace-id": "ws1",
    };

    const r1 = await POST(
      makeRequest("https://x.test/api/webhooks/inbound/n8n", payload, "POST", headers) as never,
      { params: Promise.resolve({ source: "n8n" }) }
    );
    expect(r1.status).toBe(201);
    const b1 = await r1.json();
    expect(b1.duplicate).toBeUndefined();

    const r2 = await POST(
      makeRequest("https://x.test/api/webhooks/inbound/n8n", payload, "POST", headers) as never,
      { params: Promise.resolve({ source: "n8n" }) }
    );
    expect(r2.status).toBe(200);
    const b2 = await r2.json();
    expect(b2.duplicate).toBe(true);
    expect(b2.id).toBe("ext-123");
  });
});
