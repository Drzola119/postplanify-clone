import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-retry";
const mockUid = "uid-retry";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockGetPost = vi.fn();
const mockUpdatePost = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/posts", () => ({
  getPost: (...args: unknown[]) => mockGetPost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
}));

const { POST } = await import("@/app/api/posts/scheduled/[id]/retry/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

function makeReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ctx = () => ({ params: Promise.resolve({ id: "post-1" }) });

describe("POST /api/posts/scheduled/[id]/retry", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await POST(makeReq({}) as never, ctx());
    expect(res.status).toBe(401);
  });

  it("returns 404 when post not found", async () => {
    mockGetPost.mockResolvedValueOnce(null);
    const res = await POST(makeReq({}) as never, ctx());
    expect(res.status).toBe(404);
  });

  it("returns 409 when post is in a non-retryable state", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "published" });
    const res = await POST(makeReq({}) as never, ctx());
    expect(res.status).toBe(409);
  });

  it("retries a failed post by defaulting to scheduledAt=now", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "failed", failureReason: "n8n 500" });
    mockUpdatePost.mockResolvedValueOnce(undefined);
    const res = await POST(makeReq({}) as never, ctx());
    expect(res.status).toBe(200);
    expect(mockUpdatePost).toHaveBeenCalledWith(
      mockWorkspaceId,
      "post-1",
      expect.objectContaining({
        status: "scheduled",
        scheduledAt: expect.any(Date),
        failureReason: null,
      }),
    );
  });

  it("retries a paused post", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "paused" });
    mockUpdatePost.mockResolvedValueOnce(undefined);
    const res = await POST(makeReq({}) as never, ctx());
    expect(res.status).toBe(200);
  });

  it("accepts an explicit scheduledAt", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "failed" });
    mockUpdatePost.mockResolvedValueOnce(undefined);
    const res = await POST(makeReq({ scheduledAt: "2026-12-01T10:00:00Z" }) as never, ctx());
    expect(res.status).toBe(200);
    expect(mockUpdatePost).toHaveBeenCalledWith(
      mockWorkspaceId,
      "post-1",
      expect.objectContaining({
        status: "scheduled",
        scheduledAt: new Date("2026-12-01T10:00:00Z"),
      }),
    );
  });

  it("returns 400 for malformed body", async () => {
    mockGetPost.mockResolvedValueOnce({ id: "post-1", status: "failed" });
    const res = await POST(makeReq({ scheduledAt: "not-a-date" }) as never, ctx());
    expect(res.status).toBe(400);
  });
});
