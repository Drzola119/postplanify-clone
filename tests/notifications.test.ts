import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "./fixtures/firestore-mock";

const globalState = globalThis as unknown as { __notificationFs?: MockFirestore };
globalState.__notificationFs = createMockFirestore();
const mockFs = globalState.__notificationFs;
const mockRequireSession = vi.fn(async () => ({ uid: "uid-notifications", workspaceId: "workspace-1" }));

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: (globalThis as unknown as { __notificationFs: MockFirestore }).__notificationFs,
}));

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));

const {
  clearNotificationPreferenceCache,
  createNotification,
  getNotificationFeed,
  listNotifications,
} = await import("@/lib/notifications");

beforeEach(() => {
  mockFs.reset();
  clearNotificationPreferenceCache("uid-notifications");
});

describe("notification service", () => {
  it("creates deterministic notifications only once for a repeated event", async () => {
    const input = {
      type: "post_failed" as const,
      category: "publishing" as const,
      title: "Post failed",
      message: "The post could not be published.",
      dedupeKey: "post:workspace-1:post-1:failed",
    };

    expect(await createNotification("uid-notifications", input)).toBe(true);
    expect(await createNotification("uid-notifications", input)).toBe(false);

    const docs = mockFs.dump().filter((doc) => doc.path.includes("/notifications/"));
    expect(docs).toHaveLength(1);
    expect(docs[0].data.dedupeKey).toBe(input.dedupeKey);
  });

  it("respects configurable preferences while keeping critical alerts enabled", async () => {
    await mockFs.doc("users/uid-notifications").set({
      notif: { postPublished: false, inboxMessage: false },
    });

    expect(await createNotification("uid-notifications", {
      type: "post_published",
      category: "publishing",
      title: "Published",
      message: "Published",
      dedupeKey: "post:workspace-1:post-2:published",
    })).toBe(false);

    expect(await createNotification("uid-notifications", {
      type: "post_failed",
      category: "publishing",
      title: "Failed",
      message: "Failed",
      dedupeKey: "post:workspace-1:post-2:failed",
    })).toBe(true);

    expect(await createNotification("uid-notifications", {
      type: "quota_exceeded",
      category: "system",
      title: "Quota exceeded",
      message: "Quota exceeded",
      dedupeKey: "system:quota:active",
    })).toBe(true);
  });

  it("reads legacy documents and returns the bounded feed with unread count", async () => {
    await mockFs.doc("users/uid-notifications/notifications/legacy-1").set({
      type: "admin_message",
      category: "system",
      title: "Welcome",
      message: "Welcome to PostPlanify.",
      read: false,
      createdAt: "2026-09-10T10:00:00.000Z",
    });

    const items = await listNotifications("uid-notifications");
    const feed = await getNotificationFeed("uid-notifications");
    expect(items[0]?.id).toBe("legacy-1");
    expect(feed.items).toHaveLength(1);
    expect(feed.unreadCount).toBe(1);
  });
});

describe("GET /api/notifications", () => {
  it("rejects unauthenticated reads", async () => {
    const { GET } = await import("@/app/api/notifications/route");
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns the current user's notification feed", async () => {
    const { GET } = await import("@/app/api/notifications/route");
    await mockFs.doc("users/uid-notifications/notifications/n-1").set({
      type: "post_failed",
      category: "publishing",
      title: "Failed",
      message: "Failed",
      read: false,
      createdAt: "2026-09-10T10:00:00.000Z",
    });
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.unreadCount).toBe(1);
  });
});
