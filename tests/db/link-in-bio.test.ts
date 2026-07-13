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

describe("db/link-in-bio - save + public read", () => {
  it("saveBio writes both user-private and public mirror", async () => {
    const { saveBio, getByUsername, getByUidAndUsername } = await import("@/lib/db/link-in-bio");
    await saveBio("u1", {
      username: "alice",
      bio: "Hello",
      blocks: [{ type: "link", data: { url: "https://x.com" } }],
      theme: "default",
      socials: { twitter: "@alice" },
    });
    const pub = await getByUsername("alice");
    expect(pub).toBeTruthy();
    expect(pub?.bio).toBe("Hello");
    const priv = await getByUidAndUsername("u1", "alice");
    expect(priv?.blocks[0].data.url).toBe("https://x.com");
  });

  it("listForUser returns all bios for a user", async () => {
    const { saveBio, listForUser } = await import("@/lib/db/link-in-bio");
    await saveBio("u1", { username: "alice", bio: "A", blocks: [], theme: "default", socials: {} });
    await saveBio("u1", { username: "alice2", bio: "B", blocks: [], theme: "dark", socials: {} });
    const items = await listForUser("u1");
    expect(items.length).toBe(2);
  });

  it("deleteBio removes both mirrors", async () => {
    const { saveBio, deleteBio, getByUsername } = await import("@/lib/db/link-in-bio");
    await saveBio("u1", { username: "alice", bio: "A", blocks: [], theme: "default", socials: {} });
    await deleteBio("u1", "alice");
    expect(await getByUsername("alice")).toBeNull();
  });

  it("recordClick + getAnalytics increments", async () => {
    const { recordClick, getAnalytics } = await import("@/lib/db/link-in-bio");
    await recordClick("alice", null);
    await recordClick("alice", null);
    await recordClick("alice", "block-1");
    const a = await getAnalytics("alice", 1);
    expect(a.total).toBe(3);
  });
});
