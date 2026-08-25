import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
if (!g.__mockFs) g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

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

describe("queue/worker captionsByPlatform persistence", () => {
  beforeEach(() => {
    mockFs.reset();
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook";
    process.env.UPLOAD_POST_API_KEY = "test-key";
    process.env.UPLOAD_POST_DEFAULT_USERNAME = "trustiify_test";
    vi.restoreAllMocks();
  });

  it("worker sends captionsByPlatform and sameForAll from persisted doc", async () => {
    // Create workspace and scheduled post with per-platform captions
    await mockFs.doc("workspaces/ws1").set({ name: "ws1", ownerUid: "u1", plan: "free", settings: {}, createdAt: { seconds: 0, nanoseconds: 0 } });
    const postId = "post-scheduled-1";
    await mockFs.doc(`workspaces/ws1/posts/${postId}`).set({
      authorUid: "u1",
      caption: "fallback",
      captionsByPlatform: { instagram: "IG cap", twitter: "Tweet cap" },
      sameForAll: false,
      platforms: ["instagram", "twitter"],
      mediaUrls: ["https://cdn.test/a.jpg"],
      hashtags: [],
      labels: [],
      altText: [],
      collaborators: [],
      status: "scheduled",
      scheduledAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 } as Response));
    const origFetch = globalThis.fetch;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    try {
      const { runQueueTick } = await import("@/lib/queue/worker");
      const result = await runQueueTick();
      expect(result.scanned).toBe(1);
      expect(result.published).toBe(1);
      // Inspect n8n payload
      const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("n8n.test"));
      expect(call).toBeDefined();
      const body = JSON.parse(String(call![1]?.body ?? "{}"));
      expect(body.captionsByPlatform).toEqual({ instagram: "IG cap", twitter: "Tweet cap" });
      expect(body.sameForAll).toBe(false);
      expect(body.caption).toBe("fallback");
      expect(body.mediaUrls).toEqual(["https://cdn.test/a.jpg"]);
    } finally {
      (globalThis as unknown as { fetch: typeof fetch }).fetch = origFetch;
    }
  });

  it("legacy post without captionsByPlatform still publishes using caption fallback", async () => {
    await mockFs.doc("workspaces/ws2").set({ name: "ws2", ownerUid: "u2", plan: "free", settings: {}, createdAt: { seconds: 0, nanoseconds: 0 } });
    const postId = "post-legacy";
    await mockFs.doc(`workspaces/ws2/posts/${postId}`).set({
      authorUid: "u2",
      caption: "legacy caption",
      platforms: ["instagram"],
      mediaUrls: ["https://cdn.test/b.jpg"],
      hashtags: [],
      labels: [],
      altText: [],
      collaborators: [],
      status: "scheduled",
      scheduledAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 } as Response));
    const origFetch = globalThis.fetch;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    try {
      const { runQueueTick } = await import("@/lib/queue/worker");
      await runQueueTick();
      const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("n8n.test"));
      const body = JSON.parse(String(call![1]?.body ?? "{}"));
      // Should synthesize map from caption
      expect(body.caption).toBe("legacy caption");
      expect(body.captionsByPlatform).toEqual({ instagram: "legacy caption" });
    } finally {
      (globalThis as unknown as { fetch: typeof fetch }).fetch = origFetch;
    }
  });
});
