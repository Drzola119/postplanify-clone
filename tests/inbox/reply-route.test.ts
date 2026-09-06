import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
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

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function providerOk(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  process.env.UPLOAD_POST_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.UPLOAD_POST_API_KEY;
});

async function seedEditor() {
  await mockFs.doc("workspaces/ws1/members/u1").set({ role: "editor", joinedAt: new Date() });
}

async function seedComment(sentAt: Date) {
  await mockFs.doc("workspaces/ws1/comments/c1").set({
    platform: "instagram",
    externalId: "ig-c-1",
    authorHandle: "bob",
    body: "nice!",
    sentAt,
    replied: false,
    read: false,
    resolved: false,
  });
}

describe("POST /api/inbox/reply — durable delivery", () => {
  it("sends once and marks the second identical submit as duplicate (no double send)", async () => {
    await seedEditor();
    await seedComment(new Date());
    const fetchMock = vi.fn(async (_url: unknown) => providerOk({ success: true, id: "pr-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/inbox/reply/route");
    const payload = { platform: "instagram", commentId: "c1", body: "thanks!", kind: "public-reply" };
    const first = await POST(post("https://x.test/api/inbox/reply", payload) as never);
    expect(first.status).toBe(201);
    const second = await POST(post("https://x.test/api/inbox/reply", payload) as never);
    const data = (await second.json()) as { duplicate?: boolean; status?: string };
    expect(data.duplicate).toBe(true);
    expect(data.status).toBe("sent");
    // Exactly one provider call for two submits.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks viewers from sending", async () => {
    await mockFs.doc("workspaces/ws1/members/u1").set({ role: "viewer", joinedAt: new Date() });
    await seedComment(new Date());
    const { POST } = await import("@/app/api/inbox/reply/route");
    const res = await POST(
      post("https://x.test/api/inbox/reply", { platform: "instagram", commentId: "c1", body: "hi" }) as never
    );
    expect(res.status).toBe(403);
  });

  it("refuses private replies on comments older than 7 days", async () => {
    await seedEditor();
    await seedComment(new Date(Date.now() - 10 * 24 * 3600 * 1000));
    const { POST } = await import("@/app/api/inbox/reply/route");
    const res = await POST(
      post("https://x.test/api/inbox/reply", { platform: "instagram", commentId: "c1", body: "hi", kind: "private-reply" }) as never
    );
    expect(res.status).toBe(400);
  });

  it("returns delivery-unknown (not failure) on provider timeout", async () => {
    await seedEditor();
    await seedComment(new Date());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timed out", "TimeoutError");
      })
    );
    const { POST } = await import("@/app/api/inbox/reply/route");
    const res = await POST(
      post("https://x.test/api/inbox/reply", { platform: "instagram", commentId: "c1", body: "hi" }) as never
    );
    // 202: uncertain — never blindly retried, flagged for review.
    expect(res.status).toBe(202);
    const { getOp } = await import("@/lib/db/inbox-ops");
    const ops = mockFs.dump().filter((d) => d.path.includes("outboundOps"));
    expect(ops).toHaveLength(1);
    const opId = ops[0].path.split("/").pop() as string;
    expect((await getOp("ws1", opId))?.status).toBe("delivery-unknown");
  });
});

describe("POST /api/inbox/messages/send — scoped DMs", () => {
  async function seedConvo(lastInboundAt: Date | null) {
    await mockFs.doc("workspaces/ws1/conversations/k1").set({
      platform: "instagram",
      accountKey: "prof",
      participants: ["bob"],
      participantExternalIds: ["ig-u-9"],
      lastMessageAt: new Date(),
      ...(lastInboundAt ? { lastInboundAt } : {}),
      unreadCount: 1,
    });
  }

  it("sends to the scoped recipient and preserves the draft only on failure", async () => {
    await seedEditor();
    await seedConvo(new Date());
    const fetchMock = vi.fn(async (_url: unknown) => providerOk({ success: true, recipient_id: "ig-u-9", message_id: "m-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/inbox/messages/send/route");
    const res = await POST(post("https://x.test/api/inbox/messages/send", { conversationId: "k1", body: "hello" }) as never);
    expect(res.status).toBe(201);
    const sentUrl = String(fetchMock.mock.calls[0][0]);
    expect(sentUrl).toContain("/dms/send");
  });

  it("rejects unknown recipients (no free-typed usernames)", async () => {
    await seedEditor();
    await seedConvo(new Date());
    const { POST } = await import("@/app/api/inbox/messages/send/route");
    const res = await POST(
      post("https://x.test/api/inbox/messages/send", { conversationId: "k1", body: "hi", recipientId: "evil" }) as never
    );
    expect(res.status).toBe(400);
  });

  it("enforces the 24h window from the last inbound timestamp", async () => {
    await seedEditor();
    await seedConvo(new Date(Date.now() - 30 * 3600 * 1000));
    const { POST } = await import("@/app/api/inbox/messages/send/route");
    const res = await POST(post("https://x.test/api/inbox/messages/send", { conversationId: "k1", body: "hi" }) as never);
    expect(res.status).toBe(400);
  });
});
