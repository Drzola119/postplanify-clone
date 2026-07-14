import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the auth + db + worker + security modules BEFORE importing the routes.
const mockWorkspaceId = "ws-test";
const mockUid = "uid-test";

const mockGetPost = vi.fn();
const mockUpdatePost = vi.fn();
const mockSoftDeletePost = vi.fn();
const mockCreatePost = vi.fn();
const mockListScheduledDue = vi.fn();
const mockListPosts = vi.fn();
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockN8nUrl = "https://example.com/n8n";
const mockGetWorkerStatus = vi.fn(() => ({
  running: false,
  lastTickAt: "2026-01-01T00:00:00.000Z",
  lastResult: null,
}));

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/posts", () => ({
  getPost: (...args: unknown[]) => mockGetPost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  softDeletePost: (...args: unknown[]) => mockSoftDeletePost(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  listScheduledDue: (...args: unknown[]) => mockListScheduledDue(...args),
  listPosts: (...args: unknown[]) => mockListPosts(...args),
}));
vi.mock("@/lib/queue/worker", () => ({
  getWorkerStatus: () => mockGetWorkerStatus(),
}));
vi.mock("@/lib/security/server-config", () => ({
  resolvers: {
    n8nWebhookUrl: () => mockN8nUrl,
  },
  MissingServerSecretError: class MissingServerSecretError extends Error {
    secret: string;
    constructor(secret: string) {
      super(`Missing ${secret}`);
      this.secret = secret;
      this.name = "MissingServerSecretError";
    }
  },
}));

const { PATCH, DELETE } = await import("@/app/api/posts/scheduled/[id]/route");
const { POST: duplicateHandler } = await import("@/app/api/posts/scheduled/[id]/duplicate/route");
const { GET: listHandler } = await import("@/app/api/posts/scheduled/route");
const { GET: healthHandler } = await import("@/app/api/queue/health/route");

function makeReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchCtx() {
  return { params: Promise.resolve({ id: "post-1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

describe("PATCH /api/posts/scheduled/[id]", () => {
  it("returns 401 when session is missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await PATCH(makeReq({ scheduledAt: "2026-01-01T00:00:00Z" }) as never, patchCtx());
    expect(res.status).toBe(401);
  });

  it("returns 404 when post not found", async () => {
    mockGetPost.mockResolvedValueOnce(null);
    const res = await PATCH(makeReq({ scheduledAt: "2026-01-01T00:00:00Z" }) as never, patchCtx());
    expect(res.status).toBe(404);
  });

  it("returns 409 when post is published (cannot edit)", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "published" });
    const res = await PATCH(makeReq({ scheduledAt: "2026-01-01T00:00:00Z" }) as never, patchCtx());
    expect(res.status).toBe(409);
  });

  it("reschedules a scheduled post", async () => {
    mockGetPost
      .mockResolvedValueOnce({ id: "post-1", status: "scheduled" })
      .mockResolvedValueOnce({ id: "post-1", status: "scheduled", scheduledAt: "2026-06-01T00:00:00Z" });
    mockUpdatePost.mockResolvedValueOnce(undefined);
    const res = await PATCH(
      makeReq({ scheduledAt: "2026-06-01T00:00:00Z" }) as never,
      patchCtx()
    );
    expect(res.status).toBe(200);
    expect(mockUpdatePost).toHaveBeenCalledWith(
      mockWorkspaceId,
      "post-1",
      expect.objectContaining({
        scheduledAt: expect.any(Date),
        status: "scheduled",
      })
    );
  });

  it("pauses a scheduled post", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "scheduled" });
    mockUpdatePost.mockResolvedValueOnce(undefined);
    const res = await PATCH(makeReq({ status: "paused" }) as never, patchCtx());
    expect(res.status).toBe(200);
    expect(mockUpdatePost).toHaveBeenCalledWith(
      mockWorkspaceId,
      "post-1",
      expect.objectContaining({ status: "paused" })
    );
  });

  it("returns 409 when pausing a published post", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "published" });
    const res = await PATCH(makeReq({ status: "paused" }) as never, patchCtx());
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid scheduledAt", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "scheduled" });
    const res = await PATCH(makeReq({ scheduledAt: "not-a-date" }) as never, patchCtx());
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "scheduled" });
    const res = await PATCH(makeReq({}) as never, patchCtx());
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/posts/scheduled/[id]", () => {
  it("soft-deletes a scheduled post", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "scheduled" });
    mockSoftDeletePost.mockResolvedValueOnce(undefined);
    const res = await DELETE(new Request("http://localhost/", { method: "DELETE" }) as never, patchCtx());
    expect(res.status).toBe(200);
    expect(mockSoftDeletePost).toHaveBeenCalledWith(mockWorkspaceId, "post-1");
  });

  it("returns 409 when post is currently publishing", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "publishing" });
    const res = await DELETE(new Request("http://localhost/", { method: "DELETE" }) as never, patchCtx());
    expect(res.status).toBe(409);
  });

  it("returns 404 when post not found", async () => {
    mockGetPost.mockResolvedValueOnce(null);
    const res = await DELETE(new Request("http://localhost/", { method: "DELETE" }) as never, patchCtx());
    expect(res.status).toBe(404);
  });
});

describe("POST /api/posts/scheduled/[id]/duplicate", () => {
  it("creates a new draft with copied fields", async () => {
    mockGetPost.mockResolvedValueOnce({
      id: "post-1",
      caption: "hello",
      platforms: ["instagram"],
      mediaUrls: ["https://cdn/1.jpg"],
      hashtags: ["#x"],
      labels: ["promo"],
      status: "scheduled",
    });
    mockCreatePost.mockResolvedValueOnce("post-2");
    const res = await duplicateHandler(new Request("http://localhost/", { method: "POST" }) as never, patchCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("post-2");
    expect(mockCreatePost).toHaveBeenCalledWith(
      mockWorkspaceId,
      mockUid,
      expect.objectContaining({
        caption: "hello",
        status: "draft",
      })
    );
  });

  it("returns 404 when source post missing", async () => {
    mockGetPost.mockResolvedValueOnce(null);
    const res = await duplicateHandler(new Request("http://localhost/", { method: "POST" }) as never, patchCtx());
    expect(res.status).toBe(404);
  });
});

describe("GET /api/posts/scheduled", () => {
  it("returns due + upcoming + pausedCount", async () => {
    mockListScheduledDue.mockResolvedValueOnce([{ id: "due-1" }]);
    mockListPosts.mockResolvedValueOnce({
      items: [
        { id: "u-1", status: "scheduled", scheduledAt: "2026-01-02T00:00:00Z" },
        { id: "p-1", status: "paused", scheduledAt: "2026-01-05T00:00:00Z" },
        { id: "u-2", status: "scheduled", scheduledAt: "2026-01-01T00:00:00Z" },
      ],
      nextCursor: null,
    });
    const res = await listHandler(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.due).toHaveLength(1);
    expect(body.upcoming).toHaveLength(3);
    expect(body.pausedCount).toBe(1);
    // Sorted ascending
    expect(body.upcoming[0].id).toBe("u-2");
    expect(body.upcoming[1].id).toBe("u-1");
    expect(body.upcoming[2].id).toBe("p-1");
  });
});

describe("GET /api/queue/health", () => {
  it("returns worker status + n8nConfigured true", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.n8nConfigured).toBe(true);
    expect(body.running).toBe(false);
    expect(body.lastTickAt).toBe("2026-01-01T00:00:00.000Z");
  });
});