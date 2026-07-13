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

describe("db/inbox - listComments + createComment", () => {
  it("returns empty when no comments", async () => {
    const { listComments } = await import("@/lib/db/inbox");
    const r = await listComments("ws1");
    expect(r.items).toEqual([]);
  });

  it("createComment + listComments returns the doc", async () => {
    const { createComment, listComments } = await import("@/lib/db/inbox");
    await createComment("ws1", {
      platform: "twitter",
      authorHandle: "alice",
      body: "love it",
    });
    const r = await listComments("ws1");
    expect(r.items.length).toBe(1);
    expect(r.items[0].authorHandle).toBe("alice");
    expect(r.items[0].replied).toBe(false);
  });

  it("filters by platform", async () => {
    const { createComment, listComments } = await import("@/lib/db/inbox");
    await createComment("ws1", { platform: "twitter", authorHandle: "a", body: "x" });
    await createComment("ws1", { platform: "instagram", authorHandle: "b", body: "y" });
    const r = await listComments("ws1", { platform: "instagram" });
    expect(r.items.length).toBe(1);
    expect(r.items[0].platform).toBe("instagram");
  });
});

describe("db/inbox - replyToComment", () => {
  it("creates reply and marks original as replied", async () => {
    const { createComment, replyToComment, listComments } = await import("@/lib/db/inbox");
    const commentId = await createComment("ws1", {
      platform: "twitter",
      authorHandle: "alice",
      body: "first!",
    });
    const replyId = await replyToComment("ws1", commentId, "thanks for sharing");
    expect(replyId).toBeTruthy();
    const all = await listComments("ws1", { pageSize: 100 });
    const original = all.items.find((c) => c.id === commentId);
    expect(original?.replied).toBe(true);
    expect(original?.replyId).toBeTruthy();
  });
});

describe("db/inbox - listConversations + messages", () => {
  it("sends a message and bumps lastMessageAt", async () => {
    const { listConversations, sendMessage, getMessages, markConversationRead } = await import(
      "@/lib/db/inbox"
    );
    // Create a conversation manually.
    const convRef = mockFs.doc("workspaces/ws1/conversations/c1");
    await convRef.set({ platform: "instagram", participants: ["alice", "bob"], lastMessageAt: { seconds: 0, nanoseconds: 0 }, unreadCount: 0 });

    await sendMessage("ws1", "c1", "hello!", "out");
    const msgs = await getMessages("ws1", "c1");
    expect(msgs.length).toBe(1);
    expect(msgs[0].body).toBe("hello!");

    await sendMessage("ws1", "c1", "reply", "in");
    const convs = await listConversations("ws1");
    expect(convs.items.length).toBe(1);
    expect(convs.items[0].unreadCount).toBeGreaterThan(0);

    await markConversationRead("ws1", "c1");
    const convs2 = await listConversations("ws1");
    expect(convs2.items[0].unreadCount).toBe(0);
  });
});
