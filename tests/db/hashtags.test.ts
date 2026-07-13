import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

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

describe("db/hashtags - sets CRUD", () => {
  it("create + list returns the set", async () => {
    const { createSet, listSets } = await import("@/lib/db/hashtags");
    await createSet("ws1", { name: "Marketing", hashtags: ["#social", "#media"] });
    const items = await listSets("ws1");
    expect(items.length).toBe(1);
    expect(items[0].hashtags).toEqual(["#social", "#media"]);
  });

  it("update changes name", async () => {
    const { createSet, updateSet, listSets } = await import("@/lib/db/hashtags");
    const id = await createSet("ws1", { name: "Old", hashtags: ["#a"] });
    await updateSet("ws1", id, { name: "New" });
    const items = await listSets("ws1");
    expect(items[0].name).toBe("New");
  });

  it("delete removes the set", async () => {
    const { createSet, deleteSet, listSets } = await import("@/lib/db/hashtags");
    const id = await createSet("ws1", { name: "X", hashtags: ["#a"] });
    await deleteSet("ws1", id);
    expect((await listSets("ws1")).length).toBe(0);
  });
});

describe("db/hashtags - getTrending", () => {
  it("returns trending items", async () => {
    const { getTrending } = await import("@/lib/db/hashtags");
    const ref = mockFs.doc("workspaces/ws1/hashtagsTrending/t1");
    await ref.set({ tag: "#trendy", platform: "twitter", score: 95, capturedAt: { seconds: 0, nanoseconds: 0 } });
    const items = await getTrending("ws1");
    expect(items.length).toBe(1);
    expect(items[0].tag).toBe("#trendy");
  });
});
