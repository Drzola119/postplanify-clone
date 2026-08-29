import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePost = vi.fn(async (..._args: unknown[]) => "scheduled-post-id");
const mockRequireSession = vi.fn(async () => ({ uid: "uid1", workspaceId: "ws1" }));

vi.mock("@/lib/auth/session-context", () => ({ requireSession: () => mockRequireSession() }));
vi.mock("@/lib/db/posts", () => ({ createPost: (...args: unknown[]) => mockCreatePost(...args) }));

describe("POST /api/posts/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePost.mockResolvedValue("scheduled-post-id");
  });

  it("persists a scheduled post without any publishing dependency", async () => {
    const { POST } = await import("@/app/api/posts/schedule/route");
    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
    const response = await POST(new Request("http://localhost/api/posts/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "Scheduled caption",
        captionsByPlatform: { instagram: "Scheduled caption" },
        sameForAll: true,
        mediaUrls: ["https://cdn.test/image.jpg"],
        scheduledAt,
      }),
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      ok: true,
      scheduled: true,
      deliveryConfirmed: false,
      postId: "scheduled-post-id",
      scheduledAt,
    });
    expect(mockCreatePost).toHaveBeenCalledWith("ws1", "uid1", expect.objectContaining({
      status: "scheduled",
      scheduledAt: expect.any(Date),
    }));
  });

  it("rejects past schedule times", async () => {
    const { POST } = await import("@/app/api/posts/schedule/route");
    const response = await POST(new Request("http://localhost/api/posts/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "Too late",
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    }));

    expect(response.status).toBe(400);
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("fails closed when persistence is unavailable", async () => {
    mockCreatePost.mockRejectedValueOnce(new Error("database unavailable"));
    const { POST } = await import("@/app/api/posts/schedule/route");
    const response = await POST(new Request("http://localhost/api/posts/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "Do not publish this",
        scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    }));

    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/Unable to save/);
  });
});
