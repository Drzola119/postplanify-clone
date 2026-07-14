import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-health";
const mockUid = "u-health";
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

const { GET } = await import("@/app/api/accounts/health/route");

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  delete process.env.UPLOAD_POST_API_KEY;
});

describe("GET /api/accounts/health", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(401);
  });

  it("returns empty health when no cache exists", async () => {
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.health.total).toBe(0);
    expect(body.health.isStale).toBe(true);
  });

  it("returns derived health from cache", async () => {
    const fetchedAt = new Date().toISOString();
    await mockFs.doc(`workspaces/${mockWorkspaceId}`).set({
      settings: {
        uploadPostCache: {
          accounts: [
            { id: "x:ig", profileUsername: "x", platform: "instagram", handle: "@me", displayName: null, img: null, reauthRequired: false },
            { id: "x:tw", profileUsername: "x", platform: "x", handle: "@b", displayName: null, img: null, reauthRequired: true },
          ],
          profiles: [],
          plan: null,
          limit: null,
          fetchedAt,
        },
      },
    });
    const res = await GET(new Request("http://localhost/") as never);
    const body = await res.json();
    expect(body.health.total).toBe(2);
    expect(body.health.healthy).toBe(1);
    expect(body.health.needsReauth).toBe(1);
    expect(body.health.isStale).toBe(false);
  });

  it("marks stale when cache older than 24h", async () => {
    const fetchedAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await mockFs.doc(`workspaces/${mockWorkspaceId}`).set({
      settings: {
        uploadPostCache: {
          accounts: [
            { id: "x:ig", profileUsername: "x", platform: "instagram", handle: "@me", displayName: null, img: null, reauthRequired: false },
          ],
          profiles: [],
          plan: null,
          limit: null,
          fetchedAt,
        },
      },
    });
    const res = await GET(new Request("http://localhost/") as never);
    const body = await res.json();
    expect(body.health.isStale).toBe(true);
    expect(body.health.accounts[0].status).toBe("stale");
  });
});