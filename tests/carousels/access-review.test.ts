import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const mocks = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>();
  const ref = (path: string) => ({
    path,
    id: path.split("/").at(-1),
    get: async () => ({
      exists: records.has(path),
      data: () => records.get(path),
    }),
    collection: (name: string) => ({
      doc: (id = "comment_1") => ref(`${path}/${name}/${id}`),
    }),
  });
  return {
    records,
    role: vi.fn(),
    ref,
    db: {
      doc: ref,
      collection: (name: string) => ({
        doc: (id: string) => ref(`${name}/${id}`),
      }),
      runTransaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          get: (r: ReturnType<typeof ref>) => r.get(),
          set: (r: ReturnType<typeof ref>, data: Record<string, unknown>) =>
            records.set(r.path, data),
          update: (r: ReturnType<typeof ref>, data: Record<string, unknown>) =>
            records.set(r.path, { ...records.get(r.path), ...data }),
        }),
    },
  };
});
vi.mock("@/lib/firebase/admin", () => ({ adminDb: mocks.db }));
vi.mock("@/lib/auth/session-context", () => ({
  requireSession: async () => ({ workspaceId: "ws", uid: "u" }),
}));
vi.mock("@/lib/auth/workspace-role", () => ({
  getWorkspaceRole: mocks.role,
  canRead: (r: string) => ["viewer", "editor", "admin", "owner"].includes(r),
  canWrite: (r: string) => ["editor", "admin", "owner"].includes(r),
}));
vi.mock("@/lib/carousel-gen/render-document", () => ({
  renderCarouselSlide: vi.fn(),
}));
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { POST } from "@/app/api/carousels/review/route";
const token = "a".repeat(64),
  linkPath = `carouselReviewLinks/${createHash("sha256").update(token).digest("hex")}`,
  deckPath = "workspaces/ws/carousels/deck";
beforeEach(() => {
  mocks.records.clear();
  mocks.role.mockResolvedValue("editor");
  mocks.records.set(linkPath, {
    workspaceId: "ws",
    carouselId: "deck",
    revisionId: "rev_1",
    expiresAt: Date.now() + 60000,
    revoked: false,
    snapshot: { slides: [{ id: "slide1" }] },
  });
  mocks.records.set(deckPath, { currentRevisionId: "rev_1" });
});
const post = (body: Record<string, unknown>) =>
  POST(
    new Request("https://test/api/carousels/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        carouselId: "deck",
        revisionId: "rev_1",
        guestName: "Reviewer",
        ...body,
      }),
    }),
  );
describe("Workspace access and revision-pinned guest reviews", () => {
  it("rejects non-members even when a session resolves a workspace", async () => {
    mocks.role.mockResolvedValue(null);
    expect(await requireCarouselAccess(false)).toBeInstanceOf(Response);
    expect(((await requireCarouselAccess()) as Response).status).toBe(403);
  });
  it("allows viewers to read but not mutate", async () => {
    mocks.role.mockResolvedValue("viewer");
    expect(await requireCarouselAccess(false)).toEqual({
      workspaceId: "ws",
      uid: "u",
    });
    expect(((await requireCarouselAccess()) as Response).status).toBe(403);
  });
  it.each([{ revoked: true }, { expiresAt: 1 }])(
    "rejects unusable links %o",
    async (patch) => {
      mocks.records.set(linkPath, { ...mocks.records.get(linkPath), ...patch });
      expect((await post({ action: "approve" })).status).toBe(400);
      expect(mocks.records.get(deckPath)?.approval).toBeUndefined();
    },
  );
  it("cannot approve content edited after sharing", async () => {
    mocks.records.set(deckPath, { currentRevisionId: "rev_2" });
    expect((await post({ action: "approve" })).status).toBe(400);
    expect(mocks.records.get(deckPath)?.approval).toBeUndefined();
  });
  it("pins a comment to the reviewed slide and revision", async () => {
    expect(
      (
        await post({
          action: "add_comment",
          slideId: "slide1",
          content: "Clarify the evidence",
        })
      ).status,
    ).toBe(200);
    expect(mocks.records.get(`${deckPath}/comments/comment_1`)).toMatchObject({
      revisionId: "rev_1",
      slideId: "slide1",
      content: "Clarify the evidence",
    });
  });
  it("rejects comments referring to a different slide", async () => {
    expect(
      (
        await post({
          action: "add_comment",
          slideId: "unknown",
          content: "Comment",
        })
      ).status,
    ).toBe(400);
  });
  it("records approval for the exact reviewed revision", async () => {
    expect((await post({ action: "approve" })).status).toBe(200);
    expect(mocks.records.get(deckPath)?.approval).toMatchObject({
      revisionId: "rev_1",
      reviewerName: "Reviewer",
    });
  });
});
