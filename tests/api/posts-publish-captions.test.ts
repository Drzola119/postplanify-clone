import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreatePost = vi.fn(async () => "new-post-id");
const mockUpdatePost = vi.fn(async () => undefined);
const mockRequireSession = vi.fn(async () => ({ uid: "uid1", workspaceId: "ws1" }));
let mockFetch: ReturnType<typeof vi.fn>;

vi.mock("@/lib/auth/session-context", () => ({ requireSession: () => mockRequireSession() }));
vi.mock("@/lib/db/posts", () => ({ createPost: (...a: unknown[]) => mockCreatePost(...a), updatePost: (...a: unknown[]) => mockUpdatePost(...a) }));
vi.mock("@/lib/security/server-config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security/server-config")>("@/lib/security/server-config");
  return { ...actual, resolvers: { n8nWebhookUrl: () => "https://n8n.test/webhook", uploadPostApiKey: () => "key" } };
});

describe("POST /api/posts/publish caption validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ uid: "uid1", workspaceId: "ws1" } as never);
    mockCreatePost.mockResolvedValue("new-post-id");
    mockFetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) } as unknown as Response));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
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
        mediaUrls: ["https://cdn.test/a.jpg"],
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    // createPost should have been called with captionsByPlatform
    expect(mockCreatePost).toHaveBeenCalledWith("ws1", "uid1", expect.objectContaining({
      captionsByPlatform: { instagram: "IG", twitter: "TW" },
      sameForAll: false,
    }));
    const payload = JSON.parse(String(mockFetch.mock.calls[0][1]?.body ?? "{}"));
    expect(payload.captionsByPlatform).toEqual({ instagram: "IG", twitter: "TW" });
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
});
