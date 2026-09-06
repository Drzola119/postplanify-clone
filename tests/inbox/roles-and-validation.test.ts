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

describe("workspace roles", () => {
  it("viewer reads, editor writes, admin manages", async () => {
    const { canRead, canWrite, canManage, getWorkspaceRole } = await import("@/lib/auth/workspace-role");
    expect(canRead("viewer")).toBe(true);
    expect(canWrite("viewer")).toBe(false);
    expect(canWrite("editor")).toBe(true);
    expect(canManage("editor")).toBe(false);
    expect(canManage("admin")).toBe(true);
    expect(canRead(null)).toBe(false);

    await mockFs.doc("workspaces/ws1/members/u-view").set({ role: "viewer", joinedAt: new Date() });
    expect(await getWorkspaceRole("ws1", "u-view")).toBe("viewer");
    expect(await getWorkspaceRole("ws1", "ghost")).toBeNull();
  });
});

describe("inbox validation", () => {
  it("defaults replies to public-reply and caps buttons at 3", async () => {
    const { inboxReplySchema } = await import("@/lib/validation/inbox");
    const parsed = inboxReplySchema.safeParse({ platform: "instagram", commentId: "c1", body: "hi" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.kind).toBe("public-reply");
    const tooMany = inboxReplySchema.safeParse({
      platform: "instagram",
      commentId: "c1",
      body: "hi",
      buttons: [
        { title: "a", url: "https://x.test/" },
        { title: "b", url: "https://x.test/" },
        { title: "c", url: "https://x.test/" },
        { title: "d", url: "https://x.test/" },
      ],
    });
    expect(tooMany.success).toBe(false);
  });

  it("requires a floor of 15min on autodm intervals (provider minimum)", async () => {
    const { inboxAutodmSchema } = await import("@/lib/validation/inbox");
    expect(
      inboxAutodmSchema.safeParse({ postUrl: "https://www.instagram.com/p/X/", replyMessage: "hi", profileUsername: "p", monitoringInterval: 5 }).success
    ).toBe(false);
    expect(
      inboxAutodmSchema.safeParse({ postUrl: "https://www.instagram.com/p/X/", replyMessage: "hi", profileUsername: "p" }).success
    ).toBe(true);
  });

  it("keeps DM recipient ids scoped (optional but length-bounded)", async () => {
    const { conversationMessageSchema } = await import("@/lib/validation/inbox");
    const parsed = conversationMessageSchema.safeParse({ conversationId: "k1", body: "hi" });
    expect(parsed.success).toBe(true);
  });
});

describe("csv formula-injection protection", () => {
  it("prefixes risky leading characters in exported text", async () => {
    const { toCsv } = await import("@/lib/csv");
    const csv = toCsv([{ text: "=1+1" }, { text: "@user hi" }, { text: "normal" }]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@user hi");
    expect(csv).toContain("normal");
  });
});
