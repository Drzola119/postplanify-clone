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

describe("db/inbox - upsertCommentFromEvent", () => {
  it("creates a new comment on first event", async () => {
    const { upsertCommentFromEvent } = await import("@/lib/db/inbox");
    const r = await upsertCommentFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "comment",
      externalId: "ig-1",
      authorHandle: "alice",
      body: "love this!",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    expect(r.created).toBe(true);
    expect(r.comment.id).toBeTruthy();
    expect(r.comment.replied).toBe(false);
    expect(r.comment.platform).toBe("instagram");
  });

  it("dedupes on second event with same externalId", async () => {
    const { upsertCommentFromEvent, listComments } = await import("@/lib/db/inbox");
    const a = await upsertCommentFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "comment",
      externalId: "ig-dup",
      authorHandle: "alice",
      body: "first",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    const b = await upsertCommentFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "comment",
      externalId: "ig-dup",
      authorHandle: "alice",
      body: "second",
      sentAt: "2026-07-16T08:01:00.000Z",
      direction: "in",
    });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.comment.id).toBe(a.comment.id);
    const all = await listComments("ws1", { pageSize: 100 });
    expect(all.items.length).toBe(1);
  });

  it("keeps separate rows for different externalIds", async () => {
    const { upsertCommentFromEvent, listComments } = await import("@/lib/db/inbox");
    await upsertCommentFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "twitter",
      type: "comment",
      externalId: "tw-1",
      authorHandle: "a",
      body: "x",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    await upsertCommentFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "twitter",
      type: "comment",
      externalId: "tw-2",
      authorHandle: "a",
      body: "y",
      sentAt: "2026-07-16T08:01:00.000Z",
      direction: "in",
    });
    const all = await listComments("ws1", { pageSize: 100 });
    expect(all.items.length).toBe(2);
  });
});

describe("db/inbox - appendMessageFromEvent", () => {
  it("creates a conversation when none exists", async () => {
    const { appendMessageFromEvent, listConversations } = await import("@/lib/db/inbox");
    const r = await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "twitter",
      type: "message",
      externalId: "dm-1",
      authorHandle: "bob",
      body: "hi",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    expect(r.created).toBe(true);
    expect(r.messageId).toBeTruthy();
    const convs = await listConversations("ws1");
    expect(convs.items.length).toBe(1);
    expect(convs.items[0].participants).toContain("bob");
  });

  it("appends to the same conversation on replayed externalId", async () => {
    const { appendMessageFromEvent } = await import("@/lib/db/inbox");
    const a = await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "message",
      externalId: "dm-99",
      authorHandle: "carol",
      body: "yo",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    const b = await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "message",
      externalId: "dm-99",
      authorHandle: "carol",
      body: "yo again",
      sentAt: "2026-07-16T08:05:00.000Z",
      direction: "in",
    });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.conversationId).toBe(a.conversationId);
  });

  it("bumps unreadCount on inbound messages", async () => {
    const { appendMessageFromEvent, listConversations } = await import("@/lib/db/inbox");
    const { conversationId } = await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "twitter",
      type: "message",
      externalId: "dm-x",
      authorHandle: "x",
      body: "hello",
      sentAt: "2026-07-16T08:00:00.000Z",
      direction: "in",
    });
    const convs = await listConversations("ws1");
    expect(convs.items[0].unreadCount).toBeGreaterThan(0);
    expect(conversationId).toBeTruthy();
  });
});