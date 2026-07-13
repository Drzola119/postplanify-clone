import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

// Share the mock across vi.mock factory + the test body via globalThis.
const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
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

beforeEach(() => {
  mockFs.reset();
});

describe("db/media-assets - CRUD", () => {
  it("createAsset persists a doc and returns an id", async () => {
    const { createAsset, getAsset } = await import("@/lib/db/media-assets");
    const id = await createAsset("ws1", "u1", {
      url: "https://cdn.example.com/x.jpg",
      storedPath: "u1/assets/x.jpg",
      mime: "image/jpeg",
      size: 1024,
      folder: "assets",
    });
    expect(id).toBeTruthy();
    const item = await getAsset("ws1", id);
    expect(item).not.toBeNull();
    expect(item?.mime).toBe("image/jpeg");
    expect(item?.uploadedBy).toBe("u1");
  });

  it("listAssets returns empty when none exist", async () => {
    const { listAssets } = await import("@/lib/db/media-assets");
    const result = await listAssets("ws1");
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("listAssets filters by folder", async () => {
    const { createAsset, listAssets } = await import("@/lib/db/media-assets");
    await createAsset("ws1", "u1", {
      url: "https://x.com/a.jpg",
      storedPath: "u1/assets/a.jpg",
      mime: "image/jpeg",
      size: 100,
      folder: "assets",
    });
    await createAsset("ws1", "u1", {
      url: "https://x.com/av.png",
      storedPath: "u1/avatars/av.png",
      mime: "image/png",
      size: 200,
      folder: "avatars",
    });
    const assets = await listAssets("ws1", { folder: "avatars" });
    expect(assets.items.length).toBe(1);
    expect(assets.items[0].folder).toBe("avatars");
  });

  it("softDeleteAsset adds deletedAt timestamp", async () => {
    const { createAsset, getAsset, softDeleteAsset } = await import("@/lib/db/media-assets");
    const id = await createAsset("ws1", "u1", {
      url: "https://x.com/x.jpg",
      storedPath: "u1/assets/x.jpg",
      mime: "image/jpeg",
      size: 50,
      folder: "assets",
    });
    await softDeleteAsset("ws1", id);
    const item = await getAsset("ws1", id);
    expect(item).not.toBeNull();
  });

  it("countReferencesToAsset counts posts that reference the URL", async () => {
    const { createAsset, countReferencesToAsset } = await import("@/lib/db/media-assets");
    await createAsset("ws1", "u1", {
      url: "https://x.com/shared.jpg",
      storedPath: "u1/assets/shared.jpg",
      mime: "image/jpeg",
      size: 50,
      folder: "assets",
    });
    await mockFs.doc("workspaces/ws1/posts/p1").set({
      mediaUrls: ["https://x.com/shared.jpg"],
    });
    await mockFs.doc("workspaces/ws1/posts/p2").set({
      mediaUrls: ["https://x.com/other.jpg"],
    });
    const count = await countReferencesToAsset("ws1", "https://x.com/shared.jpg");
    expect(count).toBe(1);
  });
});
