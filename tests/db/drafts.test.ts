import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const globals = globalThis as unknown as { __draftsMockFs?: MockFirestore };
globals.__draftsMockFs = createMockFirestore();
const mockFs = globals.__draftsMockFs;

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: (globalThis as unknown as { __draftsMockFs: MockFirestore }).__draftsMockFs,
}));

beforeEach(() => mockFs.reset());

describe("db/drafts - listDrafts", () => {
  it("filters the current author and sorts locally without a composite query", async () => {
    await mockFs.doc("workspaces/ws1/drafts/older").set({
      authorUid: "user-1",
      caption: "Older",
      platforms: [],
      mediaItems: [],
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
    });
    await mockFs.doc("workspaces/ws1/drafts/newer").set({
      authorUid: "user-1",
      caption: "Newer",
      platforms: [],
      mediaItems: [],
      updatedAt: new Date("2026-08-22T00:00:00.000Z"),
      createdAt: new Date("2026-08-22T00:00:00.000Z"),
    });
    await mockFs.doc("workspaces/ws1/drafts/other-user").set({
      authorUid: "user-2",
      caption: "Hidden",
      platforms: [],
      mediaItems: [],
      updatedAt: new Date("2026-08-23T00:00:00.000Z"),
      createdAt: new Date("2026-08-23T00:00:00.000Z"),
    });

    const { listDrafts } = await import("@/lib/db/drafts");
    const drafts = await listDrafts("ws1", "user-1");

    expect(drafts.map((draft) => draft.id)).toEqual(["newer", "older"]);
  });
});
