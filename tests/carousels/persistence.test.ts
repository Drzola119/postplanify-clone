import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>();
  function ref(path: string) {
    return {
      id: path.split("/").at(-1),
      path,
      collection: (name: string) => ({
        doc: (id: string) => ref(`${path}/${name}/${id}`),
      }),
      get: async () => ({
        id: path.split("/").at(-1),
        exists: records.has(path),
        data: () => records.get(path),
      }),
      set: (data: Record<string, unknown>) => {
        const check = (v: unknown): void => {
          if (v === undefined) throw Error("undefined value");
          if (v && typeof v === "object") Object.values(v).forEach(check);
        };
        check(data);
        records.set(path, data);
      },
    };
  }
  return {
    records,
    ref,
    api: {
      collection: (name: string) => ({
        doc: (id: string) => ref(`${name}/${id}`),
      }),
      runTransaction: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          get: (r: ReturnType<typeof ref>) => r.get(),
          set: (r: ReturnType<typeof ref>, d: Record<string, unknown>) =>
            r.set(d),
        }),
      batch: () => ({
        set: (r: ReturnType<typeof ref>, d: Record<string, unknown>) =>
          r.set(d),
        commit: async () => {},
      }),
    },
  };
});
vi.mock("@/lib/firebase/admin", () => ({ adminDb: db.api }));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => 123 },
}));
import {
  getCarouselDocument,
  updateCarouselDocument,
} from "@/lib/carousel-gen/document-service";
const path = "workspaces/ws/carousels/deck";
beforeEach(() => {
  db.records.clear();
  db.records.set(path, {
    title: "Existing",
    slideCount: 2,
    mediaUrls: ["https://example.com/1.png", "https://example.com/2.png"],
    currentRevisionId: "rev_1",
    revisionCount: 1,
    reviewStatus: "approved",
    approval: { revisionId: "rev_1" },
  });
});
describe("Carousel persistence regressions", () => {
  it("preserves flattened legacy slides when reopening", async () => {
    const deck = await getCarouselDocument("ws", "deck");
    expect(deck?.slides[0].renderedImageUrl).toBe("https://example.com/1.png");
    expect(deck?.slides[0].isLegacyFlat).toBe(true);
  });
  it("saves without undefined values and invalidates approval on a content edit", async () => {
    const result = await updateCarouselDocument({
      workspaceId: "ws",
      carouselId: "deck",
      uid: "u",
      updates: { caption: "New copy" },
    });
    expect(result.success).toBe(true);
    expect(result.document?.currentRevisionId).not.toBe("rev_1");
    expect(result.document?.reviewStatus).toBe("in_review");
  });
  it("rejects stale revisions without changing any records", async () => {
    const before = JSON.stringify([...db.records]);
    const result = await updateCarouselDocument({
      workspaceId: "ws",
      carouselId: "deck",
      uid: "u",
      expectedRevisionId: "stale",
      updates: { caption: "Lost edit" },
    });
    expect(result).toEqual({ success: false, error: "conflict" });
    expect(JSON.stringify([...db.records])).toBe(before);
  });
  it("keeps organization-only edits from invalidating approval", async () => {
    const result = await updateCarouselDocument({
      workspaceId: "ws",
      carouselId: "deck",
      uid: "u",
      expectedRevisionId: "rev_1",
      updates: { tags: ["campaign"] },
    });
    expect(result.document?.currentRevisionId).toBe("rev_1");
    expect(result.document?.approval?.revisionId).toBe("rev_1");
  });
  it("writes append-only content snapshots on consecutive edits", async () => {
    const first = await updateCarouselDocument({
      workspaceId: "ws",
      carouselId: "deck",
      uid: "u",
      expectedRevisionId: "rev_1",
      updates: { caption: "First" },
    });
    await updateCarouselDocument({
      workspaceId: "ws",
      carouselId: "deck",
      uid: "u",
      expectedRevisionId: first.newRevisionId,
      updates: { caption: "Second" },
    });
    expect(
      db.records.get(`${path}/revisions/${first.newRevisionId}`)?.caption,
    ).toBe("First");
    expect(db.records.get(path)?.caption).toBe("Second");
  });
});
