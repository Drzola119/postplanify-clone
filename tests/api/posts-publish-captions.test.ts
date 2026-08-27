import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreatePost = vi.fn(async (..._args: unknown[]) => "new-post-id");
const mockUpdatePost = vi.fn(async (..._args: unknown[]) => undefined);
const mockRequireSession = vi.fn(async () => ({ uid: "uid1", workspaceId: "ws1" }));
const mockPublishToUploadPost = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({ requireSession: () => mockRequireSession() }));
vi.mock("@/lib/db/posts", () => ({ createPost: (...a: unknown[]) => mockCreatePost(...a), updatePost: (...a: unknown[]) => mockUpdatePost(...a) }));
vi.mock("@/lib/db/upload-post-profiles", () => ({ readProfile: vi.fn(async () => ({ username: "profile1" })) }));
vi.mock("@/lib/uploadpost/publisher", () => ({ publishToUploadPost: (...a: unknown[]) => mockPublishToUploadPost(...a) }));
vi.mock("@/lib/security/server-config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security/server-config")>("@/lib/security/server-config");
  return { ...actual, resolvers: { n8nWebhookUrl: () => "https://n8n.test/webhook", uploadPostApiKey: () => "key" } };
});

describe("POST /api/posts/publish caption validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ uid: "uid1", workspaceId: "ws1" } as never);
    mockCreatePost.mockResolvedValue("new-post-id");
    mockPublishToUploadPost.mockResolvedValue({
      accepted: true,
      deliveryConfirmed: true,
      scheduled: false,
      requestId: "request-1",
      raw: { success: true, request_id: "request-1" },
      httpStatus: 200,
    });
  });

  it("accepts valid per-platform captions", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram", "twitter"],
        caption: "fallback",
        captionsByPlatform: { instagram: "IG", twitter: "TW" },
        sameForAll: false,
        advancedByPlatform: { instagram: { instagram_media_type: "REELS" } },
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    // createPost should have been called with captionsByPlatform
    expect(mockCreatePost).toHaveBeenCalledWith("ws1", "uid1", expect.objectContaining({
      captionsByPlatform: { instagram: "IG", twitter: "TW" },
      sameForAll: false,
      advancedByPlatform: { instagram: { instagram_media_type: "REELS" } },
    }));
    expect(mockPublishToUploadPost).toHaveBeenCalledWith(expect.objectContaining({
      username: "profile1",
      captionsByPlatform: { instagram: "IG", twitter: "TW" },
      mediaUrls: ["https://cdn.test/a.jpg"],
    }));
  });

  it("rejects missing caption entry when sameForAll false", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram", "twitter"],
        caption: "fallback",
        captionsByPlatform: { instagram: "IG" }, // missing twitter
        sameForAll: false,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing caption for platform: twitter/);
  });

  it("rejects a missing caption map when sameForAll is false", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "fallback",
        sameForAll: false,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/captionsByPlatform is required/);
  });

  it("rejects whitespace-only caption", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "fallback",
        captionsByPlatform: { instagram: "   " },
        sameForAll: false,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("rejects unknown platform key", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "fallback",
        captionsByPlatform: { instagram: "IG", unknown_platform: "bad" },
        sameForAll: false,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unknown platform key/);
  });

  it("accepts text-only post with empty mediaUrls for supportsText platform", async () => {
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["twitter"],
        caption: "text only",
        captionsByPlatform: { twitter: "text only" },
        sameForAll: true,
        mediaUrls: [],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it("does not mark a post published when n8n returns an empty acknowledgement", async () => {
    mockPublishToUploadPost.mockResolvedValueOnce({
      accepted: true,
      deliveryConfirmed: false,
      scheduled: false,
      requestId: "request-empty",
      raw: {},
      httpStatus: 200,
    });
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "Keep this retryable",
        captionsByPlatform: { instagram: "Keep this retryable" },
        sameForAll: true,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body.deliveryConfirmed).toBe(false);
    expect(mockUpdatePost).not.toHaveBeenCalledWith("ws1", "new-post-id", expect.objectContaining({ status: "published" }));
  });

  it("accepts Upload-Post success results as explicit delivery confirmation", async () => {
    mockPublishToUploadPost.mockResolvedValueOnce({
      accepted: true,
      deliveryConfirmed: true,
      scheduled: false,
      requestId: "request-success",
      results: { instagram: { ok: true, url: "https://instagram.test/p/1" } },
      raw: { success: true },
      httpStatus: 200,
    });
    const { POST } = await import("@/app/api/posts/publish/route");
    const req = new Request("http://localhost/api/posts/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platforms: ["instagram"],
        caption: "Confirmed delivery",
        captionsByPlatform: { instagram: "Confirmed delivery" },
        sameForAll: true,
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    const body = await res.json();
    expect(body.deliveryConfirmed).toBe(true);
    expect(body.results).toEqual({ instagram: expect.objectContaining({ ok: true }) });
    expect(mockUpdatePost).toHaveBeenCalledWith("ws1", "new-post-id", expect.objectContaining({ status: "published" }));
  });
});
