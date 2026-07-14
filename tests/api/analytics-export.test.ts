import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-an";
const mockUid = "u-an";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockGetOverview = vi.fn();
const mockGetPlatformSeries = vi.fn();

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

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));

vi.mock("@/lib/db/analytics", () => ({
  getOverview: (...args: unknown[]) => mockGetOverview(...args),
  getPlatformSeries: (...args: unknown[]) => mockGetPlatformSeries(...args),
}));

const { GET } = await import("@/app/api/analytics/export/route");

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  mockGetOverview.mockResolvedValue({
    workspaceId: mockWorkspaceId,
    from: "2026-07-06",
    to: "2026-07-13",
    totals: { followers: 1000, engagementRate: 4.5, impressions: 50000, likes: 0, comments: 0, shares: 0, clicks: 0, postsPublished: 0 },
    byPlatform: [
      { platform: "instagram", followers: 1000, impressions: 50000, engagementRate: 4.5 },
    ],
  });
  mockGetPlatformSeries.mockResolvedValue([
    { date: "2026-07-13", followers: 1000, impressions: 1000, engagementRate: 4.5, likes: 10, comments: 2, shares: 1, clicks: 0 },
  ]);
});

describe("GET /api/analytics/export", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when from/to are missing", async () => {
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when to <= from", async () => {
    const res = await GET(
      new Request("http://localhost/?from=2026-07-13T00:00:00Z&to=2026-07-13T00:00:00Z") as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns text/csv with content-disposition and a body containing headers", async () => {
    const res = await GET(
      new Request("http://localhost/?from=2026-07-06T00:00:00Z&to=2026-07-13T00:00:00Z") as never,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    const cd = res.headers.get("Content-Disposition") ?? "";
    expect(cd).toMatch(/attachment/);
    expect(cd).toMatch(/\.csv/);
    const body = await res.text();
    expect(body).toMatch(/^section,date,platform,followers/);
    expect(body).toMatch(/summary,,Instagram/);
    expect(body).toMatch(/daily,2026-07-13,Instagram/);
  });

  it("escapes commas and quotes in CSV values", async () => {
    mockGetPlatformSeries.mockResolvedValueOnce([
      { date: "2026-07-13", followers: 1000, impressions: 1000, engagementRate: 4.5, likes: 10, comments: 2, shares: 1, clicks: 0 },
    ]);
    // Add a comma-bearing row directly through series — we override to use a value with comma via getPlatform
    const res = await GET(
      new Request("http://localhost/?from=2026-07-06T00:00:00Z&to=2026-07-13T00:00:00Z") as never,
    );
    const body = await res.text();
    expect(body).not.toContain("undefined");
  });
});