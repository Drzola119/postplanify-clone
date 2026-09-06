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

describe("inbox-ops idempotency", () => {
  it("derives stable keys (same input → same key, different body → different)", async () => {
    const { buildIdempotencyKey } = await import("@/lib/db/inbox-ops");
    const base = { kind: "public-reply" as const, accountKey: "prof", platform: "instagram", targetId: "c1" };
    expect(buildIdempotencyKey({ ...base, body: "hi" })).toBe(buildIdempotencyKey({ ...base, body: "hi" }));
    expect(buildIdempotencyKey({ ...base, body: "hi" })).not.toBe(buildIdempotencyKey({ ...base, body: "yo" }));
  });

  it("getOrCreateOp dedupes double submits (double-click safe)", async () => {
    const { getOrCreateOp } = await import("@/lib/db/inbox-ops");
    const input = {
      kind: "public-reply" as const,
      platform: "instagram" as const,
      accountKey: "prof",
      targetId: "c1",
      providerTargetId: "ig-1",
      body: "thanks!",
      origin: "manual" as const,
      createdBy: "u1",
    };
    const first = await getOrCreateOp("ws1", input);
    const second = await getOrCreateOp("ws1", input);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);
    expect(second.op.status).toBe("pending");
  });

  it("claimOp lets exactly one worker through; finalize moves to sent", async () => {
    const { getOrCreateOp, claimOp, finalizeOp, getOp } = await import("@/lib/db/inbox-ops");
    const { id } = await getOrCreateOp("ws1", {
      kind: "dm-send",
      platform: "instagram",
      accountKey: "prof",
      targetId: "k1",
      body: "hello",
      origin: "manual",
      createdBy: "u1",
    });
    expect(await claimOp("ws1", id)).toBe(true);
    // Concurrent worker / repeated request loses the race — no double send.
    expect(await claimOp("ws1", id)).toBe(false);
    await finalizeOp("ws1", id, { status: "sent", providerMessageId: "m-1" });
    expect((await getOp("ws1", id))?.status).toBe("sent");
    // Sent ops are never re-claimed.
    expect(await claimOp("ws1", id)).toBe(false);
  });

  it("supports the delivery-unknown terminal state", async () => {
    const { getOrCreateOp, claimOp, finalizeOp, getOp } = await import("@/lib/db/inbox-ops");
    const { id } = await getOrCreateOp("ws1", {
      kind: "private-reply",
      platform: "instagram",
      accountKey: "prof",
      targetId: "c9",
      body: "check DMs",
      origin: "manual",
      createdBy: "u1",
    });
    expect(await claimOp("ws1", id)).toBe(true);
    await finalizeOp("ws1", id, {
      status: "delivery-unknown",
      error: { code: "timeout", message: "uncertain", retryable: false },
    });
    const op = await getOp("ws1", id);
    expect(op?.status).toBe("delivery-unknown");
    expect(op?.error?.retryable).toBe(false);
  });
});

describe("inbox identity scoping", () => {
  it("scopes comment identity by account+platform (external ids are not global)", async () => {
    const { upsertCommentFromEvent } = await import("@/lib/db/inbox");
    const base = {
      workspaceId: "ws1",
      platform: "instagram" as const,
      type: "comment" as const,
      externalId: "same-id",
      authorHandle: "bob",
      body: "hi",
      sentAt: "2026-09-05T00:00:00.000Z",
    };
    const a = await upsertCommentFromEvent("ws1", { ...base, accountKey: "prof-a" });
    const b = await upsertCommentFromEvent("ws1", { ...base, accountKey: "prof-b" });
    expect(a.created).toBe(true);
    // Same external id under a different account is a different record.
    expect(b.created).toBe(true);
    expect(a.comment.id).not.toBe(b.comment.id);
  });

  it("dedupes re-ingestion under the same account", async () => {
    const { upsertCommentFromEvent, listComments } = await import("@/lib/db/inbox");
    const evt = {
      workspaceId: "ws1",
      platform: "instagram" as const,
      type: "comment" as const,
      externalId: "dup-1",
      authorHandle: "bob",
      authorExternalId: "ig-u-9",
      body: "hi",
      sentAt: "2026-09-05T00:00:00.000Z",
      accountKey: "prof",
      externalPostId: "media-1",
      postPermalink: "https://www.instagram.com/p/X/",
    };
    await upsertCommentFromEvent("ws1", evt);
    const again = await upsertCommentFromEvent("ws1", evt);
    expect(again.created).toBe(false);
    const { items } = await listComments("ws1", {});
    expect(items.filter((c) => c.externalId === "dup-1")).toHaveLength(1);
    expect(items[0].authorExternalId).toBe("ig-u-9");
    expect(items[0].postPermalink).toBe("https://www.instagram.com/p/X/");
  });

  it("never extends the DM window on our own sends", async () => {
    const { findOrCreateConversation, appendMessageFromEvent } = await import("@/lib/db/inbox");
    const { conversationId } = await findOrCreateConversation("ws1", {
      platform: "instagram",
      accountKey: "prof",
      providerConversationId: "t-1",
      participants: ["bob"],
      participantExternalIds: ["ig-u-9"],
    });
    const inboundAt = "2026-09-05T10:00:00.000Z";
    await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "message",
      conversationId,
      externalId: "msg-in",
      authorHandle: "bob",
      authorExternalId: "ig-u-9",
      body: "hello?",
      sentAt: inboundAt,
      direction: "in",
      accountKey: "prof",
    });
    await appendMessageFromEvent("ws1", {
      workspaceId: "ws1",
      platform: "instagram",
      type: "message",
      conversationId,
      externalId: "msg-out",
      authorHandle: "you",
      body: "hi!",
      sentAt: "2026-09-06T10:00:00.000Z",
      direction: "out",
      accountKey: "prof",
    });
    const { adminDb } = await import("@/lib/firebase/admin");
    const snap = await (adminDb as unknown as MockFirestore).doc(`workspaces/ws1/conversations/${conversationId}`).get();
    const data = snap.data() as { lastInboundAt?: Date | { seconds: number } };
    const storedMs =
      data.lastInboundAt instanceof Date
        ? data.lastInboundAt.getTime()
        : typeof data.lastInboundAt?.seconds === "number"
          ? data.lastInboundAt.seconds * 1000
          : NaN;
    // lastInboundAt still points at the inbound message, not our reply.
    expect(storedMs).toBe(new Date(inboundAt).getTime());
  });
});
