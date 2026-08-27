import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
if (!g.__mockFs) g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;
const publishMock = vi.fn();

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
vi.mock("@/lib/db/upload-post-profiles", () => ({
  readProfile: vi.fn(async () => ({ username: "trustiify_test" })),
  ensureProfile: vi.fn(async () => ({ username: "trustiify_test" })),
}));
vi.mock("@/lib/uploadpost/publisher", () => ({
  publishToUploadPost: (...args: unknown[]) => publishMock(...args),
}));

describe("queue/worker captionsByPlatform persistence", () => {
  beforeEach(() => {
    mockFs.reset();
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook";
    process.env.UPLOAD_POST_API_KEY = "test-key";
    process.env.UPLOAD_POST_DEFAULT_USERNAME = "trustiify_test";
    vi.restoreAllMocks();
    publishMock.mockReset();
    publishMock.mockResolvedValue({ accepted: true, deliveryConfirmed: true, scheduled: false, requestId: "req", results: { instagram: { ok: true }, twitter: { ok: true } }, raw: {}, httpStatus: 200 });
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
      advancedByPlatform: { instagram: { instagram_media_type: "REELS" } },
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
    const { runQueueTick } = await import("@/lib/queue/worker");
    const result = await runQueueTick();
    expect(result.scanned).toBe(1);
    expect(result.published).toBe(1);
    expect(publishMock).toHaveBeenCalledWith(expect.objectContaining({
      captionsByPlatform: { instagram: "IG cap", twitter: "Tweet cap" },
      caption: "fallback",
      mediaUrls: ["https://cdn.test/a.jpg"],
      advancedByPlatform: { instagram: { instagram_media_type: "REELS" } },
    }));
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
    const { runQueueTick } = await import("@/lib/queue/worker");
    await runQueueTick();
    expect(publishMock).toHaveBeenCalledWith(expect.objectContaining({
      caption: "legacy caption",
      captionsByPlatform: { instagram: "legacy caption" },
    }));
  });
});
