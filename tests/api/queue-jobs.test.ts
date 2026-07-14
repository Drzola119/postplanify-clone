import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-cc";
const mockUid = "uid-cc";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockListPosts = vi.fn();
const mockGetWorkerStatus = vi.fn(() => ({
  running: true,
  lastTickAt: "2026-03-10T12:00:00.000Z",
  lastResult: { scanned: 5, published: 3, failed: 1, reaped: 0 },
}));
const mockRunQueueTick = vi.fn(async () => ({ scanned: 2, published: 1, failed: 0, reaped: 0 }));

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/posts", () => ({
  listPosts: (...args: unknown[]) => mockListPosts(...args),
}));
vi.mock("@/lib/queue/worker", () => ({
  getWorkerStatus: () => mockGetWorkerStatus(),
  runQueueTick: mockRunQueueTick,
}));
vi.mock("@/lib/security/server-config", () => ({
  resolvers: { n8nWebhookUrl: () => "https://n8n.example.com/webhook" },
  MissingServerSecretError: class MissingServerSecretError extends Error {
    secret: string;
    constructor(secret: string) {
      super(`Missing ${secret}`);
      this.secret = secret;
      this.name = "MissingServerSecretError";
    }
  },
}));

const { GET } = await import("@/app/api/queue/jobs/route");
const { POST: runTickHandler } = await import("@/app/api/queue/run-tick/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  mockListPosts.mockImplementation(async (_ws: string, filters: { status?: string }) => {
    if (filters.status === "publishing") return { items: [{ id: "p-1", status: "publishing", claimedAt: "2026-03-10T12:00:00Z" }], nextCursor: null };
    if (filters.status === "failed") return { items: [{ id: "p-2", status: "failed", failureReason: "n8n 503" }], nextCursor: null };
    return { items: [], nextCursor: null };
  });
  mockRunQueueTick.mockResolvedValue({ scanned: 2, published: 1, failed: 0, reaped: 0 });
  mockGetWorkerStatus.mockReturnValue({
    running: true,
    lastTickAt: "2026-03-10T12:00:00.000Z",
    lastResult: { scanned: 5, published: 3, failed: 1, reaped: 0 },
  });
});

describe("GET /api/queue/jobs", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(401);
  });

  it("returns inflight + failed + health", async () => {
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inflight).toHaveLength(1);
    expect(body.failed).toHaveLength(1);
    expect(body.health.running).toBe(true);
    expect(body.health.n8nConfigured).toBe(true);
    expect(body.health.intervalMs).toBeDefined();
  });

  it("queries publishing + failed in parallel", async () => {
    await GET(new Request("http://localhost/") as never);
    const calls = mockListPosts.mock.calls.map((c) => c[1]?.status);
    expect(calls).toContain("publishing");
    expect(calls).toContain("failed");
  });
});

describe("POST /api/queue/run-tick", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await runTickHandler(new Request("http://localhost/", { method: "POST" }) as never);
    expect(res.status).toBe(401);
  });

  it("invokes runQueueTick and returns the result", async () => {
    const res = await runTickHandler(new Request("http://localhost/", { method: "POST" }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.scanned).toBe(2);
    expect(body.result.published).toBe(1);
    expect(mockRunQueueTick).toHaveBeenCalled();
  });

  it("returns 500 when the worker throws", async () => {
    mockRunQueueTick.mockRejectedValueOnce(new Error("n8n down"));
    const res = await runTickHandler(new Request("http://localhost/", { method: "POST" }) as never);
    expect(res.status).toBe(500);
  });
});
