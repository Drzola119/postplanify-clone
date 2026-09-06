import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-ms";
const mockUid = "uid-ms";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));

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
  requireSession: () => mockRequireSession(),
}));

const { POST } = await import("@/app/api/inbox/messages/send/route");

function providerOk(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

beforeEach(async () => {
  mockFs.reset();
  vi.clearAllMocks();
  process.env.UPLOAD_POST_API_KEY = "test-key";
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  await mockFs.doc(`workspaces/${mockWorkspaceId}/members/${mockUid}`).set({ role: "editor", joinedAt: new Date() });
  await mockFs.doc(`workspaces/${mockWorkspaceId}/conversations/c1`).set({
    platform: "instagram",
    accountKey: "prof",
    participants: ["bob"],
    participantExternalIds: ["ig-u-9"],
    lastMessageAt: new Date(),
    lastInboundAt: new Date(),
    unreadCount: 1,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.UPLOAD_POST_API_KEY;
});

function makeReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/inbox/messages/send (durable provider delivery)", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await POST(makeReq({ conversationId: "c1", body: "hi" }) as never);
    expect(res.status).toBe(401);
  });

  it("sends a provider-confirmed DM to the scoped recipient", async () => {
    const fetchMock = vi.fn(async (_url: unknown) =>
      providerOk({ success: true, recipient_id: "ig-u-9", message_id: "m-1" })
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await POST(makeReq({ conversationId: "c1", body: "hello" }) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("sent");
    expect(body.providerMessageId).toBe("m-1");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/dms/send");
  });

  it("rejects unknown recipients (no free-typed usernames)", async () => {
    const res = await POST(makeReq({ conversationId: "c1", body: "hi", recipientId: "evil" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing body", async () => {
    const res = await POST(makeReq({ conversationId: "c1" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty conversationId", async () => {
    const res = await POST(makeReq({ conversationId: "", body: "hi" }) as never);
    expect(res.status).toBe(400);
  });
});
