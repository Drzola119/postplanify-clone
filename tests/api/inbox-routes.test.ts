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

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
});

function makeRequest(url: string, body?: unknown, method = "GET"): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

describe("api/inbox/comments - GET", () => {
  it("returns empty list when no comments", async () => {
    const { GET } = await import("@/app/api/inbox/comments/route");
    const res = await GET(makeRequest("https://x.test/api/inbox/comments") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.comments).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it("returns comments for the workspace", async () => {
    const { createComment } = await import("@/lib/db/inbox");
    await createComment("ws1", { platform: "twitter", authorHandle: "alice", body: "hi" });
    await createComment("ws1", { platform: "instagram", authorHandle: "bob", body: "yo" });

    const { GET } = await import("@/app/api/inbox/comments/route");
    const res = await GET(
      makeRequest("https://x.test/api/inbox/comments?platform=instagram") as never
    );
    const body = await res.json();
    expect(body.comments.length).toBe(1);
    expect(body.comments[0].platform).toBe("instagram");
  });

  it("rejects invalid filters", async () => {
    const { GET } = await import("@/app/api/inbox/comments/route");
    const res = await GET(
      makeRequest("https://x.test/api/inbox/comments?pageSize=9999") as never
    );
    expect(res.status).toBe(400);
  });
});

describe("api/inbox/comments - POST", () => {
  it("creates a comment and returns 201", async () => {
    const { POST } = await import("@/app/api/inbox/comments/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/inbox/comments",
        { platform: "twitter", authorHandle: "alice", body: "great post" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });

  it("rejects missing required fields", async () => {
    const { POST } = await import("@/app/api/inbox/comments/route");
    const res = await POST(
      makeRequest("https://x.test/api/inbox/comments", { platform: "twitter" }, "POST") as never
    );
    expect(res.status).toBe(400);
  });
});

describe("api/inbox/reply - POST", () => {
  it("creates reply and fires webhook event", async () => {
    const deliverSpy = vi.fn(async () => []);
    vi.doMock("@/lib/webhooks/delivery", () => ({
      deliverWebhook: deliverSpy,
      signPayload: vi.fn(),
    }));

    const { createComment } = await import("@/lib/db/inbox");
    const commentId = await createComment("ws1", {
      platform: "twitter",
      authorHandle: "alice",
      body: "first!",
    });

    vi.resetModules();
    const { POST } = await import("@/app/api/inbox/reply/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/inbox/reply",
        { platform: "twitter", commentId, body: "thanks!" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.replyId).toBeTruthy();

    // Wait for fire-and-forget to flush.
    await new Promise((r) => setTimeout(r, 10));
    expect(deliverSpy).toHaveBeenCalled();
  });

  it("rejects empty body", async () => {
    const { POST } = await import("@/app/api/inbox/reply/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/inbox/reply",
        { platform: "twitter", commentId: "c1", body: "" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(400);
  });
});
