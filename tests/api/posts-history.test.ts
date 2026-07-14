import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-history";
const mockUid = "uid-history";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockListPostsHistory = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/posts", () => ({
  listPostsHistory: (...args: unknown[]) => mockListPostsHistory(...args),
}));

const { GET } = await import("@/app/api/posts/history/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

describe("GET /api/posts/history", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(401);
  });

  it("returns posts + computed stats for default range", async () => {
    const now = new Date().toISOString();
    mockListPostsHistory.mockResolvedValueOnce({
      items: [
        { id: "p1", status: "published", platforms: ["instagram"], publishedAt: now, caption: "Hello", createdAt: now },
        { id: "p2", status: "published", platforms: ["twitter"], publishedAt: now, caption: "Hello world", createdAt: now },
        { id: "p3", status: "failed", platforms: ["instagram"], publishedAt: now, caption: "Oops", createdAt: now },
      ],
    });
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.posts).toHaveLength(3);
    expect(body.stats.published).toBe(2);
    expect(body.stats.failed).toBe(1);
    expect(body.stats.total).toBe(3);
    expect(body.stats.successRate).toBeCloseTo(66.7, 1);
    expect(body.stats.byPlatform.instagram.published).toBe(1);
    expect(body.stats.byPlatform.instagram.failed).toBe(1);
    expect(body.stats.byPlatform.twitter.published).toBe(1);
  });

  it("returns null successRate when no posts", async () => {
    mockListPostsHistory.mockResolvedValueOnce({ items: [] });
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.published).toBe(0);
    expect(body.stats.failed).toBe(0);
    expect(body.stats.successRate).toBeNull();
  });

  it("parses platform filter from query", async () => {
    mockListPostsHistory.mockResolvedValueOnce({ items: [] });
    const req = new Request("http://localhost/?platform=instagram") as never;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockListPostsHistory).toHaveBeenCalledWith(
      mockWorkspaceId,
      expect.objectContaining({ platform: "instagram" }),
    );
  });

  it("parses status filter from query", async () => {
    mockListPostsHistory.mockResolvedValueOnce({ items: [] });
    const req = new Request("http://localhost/?status=failed") as never;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockListPostsHistory).toHaveBeenCalledWith(
      mockWorkspaceId,
      expect.objectContaining({ status: "failed" }),
    );
  });

  it("parses from/to as Date", async () => {
    mockListPostsHistory.mockResolvedValueOnce({ items: [] });
    const url = "http://localhost/?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z";
    const res = await GET(new Request(url) as never);
    expect(res.status).toBe(200);
    expect(mockListPostsHistory).toHaveBeenCalledWith(
      mockWorkspaceId,
      expect.objectContaining({
        from: new Date("2026-01-01T00:00:00Z"),
        to: new Date("2026-02-01T00:00:00Z"),
      }),
    );
  });

  it("returns 400 for invalid date format", async () => {
    const req = new Request("http://localhost/?from=not-a-date") as never;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    const req = new Request("http://localhost/?status=archived") as never;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
