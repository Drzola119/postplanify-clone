import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-boost";
const mockUid = "u-boost";
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

const { GET, PATCH } = await import("@/app/api/posts/boost/[id]/route");

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

function patchReq(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/posts/boost/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/posts/boost/[id]", () => {
  it("returns 404 when post not found", async () => {
    const res = await GET(new Request("http://localhost/") as never, {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns null boost when post has none", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "published" });
    const res = await GET(new Request("http://localhost/") as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boost).toBeNull();
  });

  it("returns existing boost config", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({
      status: "published",
      boostConfig: { status: "active", budgetCents: 5000, durationDays: 7 },
    });
    const res = await GET(new Request("http://localhost/") as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    const body = await res.json();
    expect(body.boost.status).toBe("active");
    expect(body.boost.budgetCents).toBe(5000);
  });
});

describe("PATCH /api/posts/boost/[id]", () => {
  it("returns 404 when post missing", async () => {
    const res = await PATCH(patchReq("nope", { enabled: true }) as never, {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects boosting a draft post with 409", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "draft" });
    const res = await PATCH(patchReq("p1", { enabled: true, budgetCents: 1000 }) as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(409);
  });

  it("enables boost on a published post with computed endsAt", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "published" });
    const res = await PATCH(
      patchReq("p1", { enabled: true, budgetCents: 2500, durationDays: 3 }) as never,
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boost.status).toBe("active");
    expect(body.boost.budgetCents).toBe(2500);
    expect(body.boost.durationDays).toBe(3);
    const snap = await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).get();
    expect((snap.data() as Record<string, unknown>).boostConfig).toBeTruthy();
  });

  it("defaults duration to 7 days when omitted", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "published" });
    const res = await PATCH(patchReq("p1", { enabled: true }) as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    const body = await res.json();
    expect(body.boost.durationDays).toBe(7);
  });

  it("pauses boost when enabled=false", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({
      status: "published",
      boostConfig: { status: "active" },
    });
    const res = await PATCH(patchReq("p1", { enabled: false }) as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boost.status).toBe("paused");
  });

  it("rejects invalid payload", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "published" });
    const res = await PATCH(patchReq("p1", { enabled: true, budgetCents: -10 }) as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects duration > 365 days", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/posts/p1`).set({ status: "published" });
    const res = await PATCH(patchReq("p1", { enabled: true, durationDays: 999 }) as never, {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(400);
  });
});