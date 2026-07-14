import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-media";
const mockUid = "u-media";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));

vi.mock("@/lib/firebase/admin", () => {
  const fs = (globalThis as unknown as { __mockFs: MockFirestore }).__mockFs;
  // Augment mock with a FieldValue helper that mirrors firebase-admin's
  // sentinel semantics — the firestore-mock translates it back into a plain
  // array via applyFieldSentinels' _methodName === "arrayUnion" branch.
  (fs as unknown as { FieldValue: unknown }).FieldValue = {
    arrayUnion: (...elements: unknown[]) => ({ _methodName: "arrayUnion", _elements: elements }),
    arrayRemove: (...elements: unknown[]) => ({ _methodName: "arrayRemove", _elements: elements }),
    increment: (n: number) => ({ _methodName: "increment", _operand: n }),
    serverTimestamp: () => ({ _methodName: "serverTimestamp" }),
    delete: () => ({ _methodName: "delete" }),
  };
  return {
    adminApp: { name: "mock" },
    adminAuth: null,
    adminDb: fs,
    SESSION_COOKIE: "pp_session",
    SESSION_MAX_AGE_MS: 432000000,
    createSessionCookie: vi.fn(async () => null),
    verifySessionCookie: vi.fn(async () => null),
    getCurrentUser: vi.fn(async () => null),
  };
});

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    arrayUnion: (...elements: unknown[]) => ({ _methodName: "arrayUnion", _elements: elements }),
    arrayRemove: (...elements: unknown[]) => ({ _methodName: "arrayRemove", _elements: elements }),
    increment: (n: number) => ({ _methodName: "increment", _operand: n }),
    serverTimestamp: () => ({ _methodName: "serverTimestamp" }),
    delete: () => ({ _methodName: "delete" }),
  },
  FieldPath: class {},
  Filter: class {},
  Timestamp: { now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }), fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }) },
}));

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));

const { GET: listGet } = await import("@/app/api/media/list/route");
const { POST: bulkPost } = await import("@/app/api/media/bulk/route");

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

function bulkReq(body: unknown): Request {
  return new Request("http://localhost/api/media/bulk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/media/list", () => {
  it("returns empty when no assets", async () => {
    const res = await listGet(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assets).toEqual([]);
  });

  it("filters by folder", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).set({
      mime: "image/png",
      size: 100,
      uploadedBy: mockUid,
      tags: [],
      folder: "posts",
      url: "https://x/a1.png",
      storedPath: "a1.png",
      uploadedAt: new Date(),
    });
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).set({
      mime: "image/png",
      size: 100,
      uploadedBy: mockUid,
      tags: [],
      folder: "brands",
      url: "https://x/a2.png",
      storedPath: "a2.png",
      uploadedAt: new Date(),
    });
    const res = await listGet(new Request("http://localhost/?folder=brands") as never);
    const body = await res.json();
    expect(body.assets).toHaveLength(1);
    expect(body.assets[0].folder).toBe("brands");
  });

  it("filters by tag (post-fetch filter)", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).set({
      mime: "image/png",
      size: 100,
      uploadedBy: mockUid,
      tags: ["hero"],
      folder: "posts",
      url: "https://x/a1.png",
      storedPath: "a1.png",
      uploadedAt: new Date(),
    });
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).set({
      mime: "image/png",
      size: 100,
      uploadedBy: mockUid,
      tags: [],
      folder: "posts",
      url: "https://x/a2.png",
      storedPath: "a2.png",
      uploadedAt: new Date(),
    });
    const res = await listGet(new Request("http://localhost/?tag=hero") as never);
    const body = await res.json();
    expect(body.assets).toHaveLength(1);
    expect(body.assets[0].tags).toContain("hero");
  });

  it("rejects invalid folder", async () => {
    const res = await listGet(new Request("http://localhost/?folder=invalid") as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/media/bulk", () => {
  it("soft-deletes multiple assets", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).set({ url: "x" });
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).set({ url: "y" });
    const res = await bulkPost(bulkReq({ action: "delete", assetIds: ["a1", "a2"] }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(2);
    const a1 = await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).get();
    expect((a1.data() as Record<string, unknown>).deletedAt).toBeTruthy();
  });

  it("adds a tag to multiple assets", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).set({ tags: ["old"] });
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).set({ tags: [] });
    const res = await bulkPost(bulkReq({ action: "tag", assetIds: ["a1", "a2"], tag: "promo" }) as never);
    expect(res.status).toBe(200);
    const a1 = await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).get();
    const a2 = await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).get();
    expect((a1.data() as Record<string, unknown>).tags).toContain("promo");
    expect((a2.data() as Record<string, unknown>).tags).toContain("promo");
  });

  it("moves multiple assets to a folder", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).set({ folder: "assets" });
    await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).set({ folder: "posts" });
    const res = await bulkPost(bulkReq({ action: "move", assetIds: ["a1", "a2"], folder: "brands" }) as never);
    expect(res.status).toBe(200);
    const a1 = await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a1`).get();
    const a2 = await mockFs.doc(`workspaces/${mockWorkspaceId}/mediaAssets/a2`).get();
    expect((a1.data() as Record<string, unknown>).folder).toBe("brands");
    expect((a2.data() as Record<string, unknown>).folder).toBe("brands");
  });

  it("rejects empty assetIds", async () => {
    const res = await bulkPost(bulkReq({ action: "delete", assetIds: [] }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects > 100 assetIds", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `a${i}`);
    const res = await bulkPost(bulkReq({ action: "delete", assetIds: ids }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid action", async () => {
    const res = await bulkPost(bulkReq({ action: "spam", assetIds: ["a"] }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid folder on move", async () => {
    const res = await bulkPost(bulkReq({ action: "move", assetIds: ["a"], folder: "elsewhere" }) as never);
    expect(res.status).toBe(400);
  });
});