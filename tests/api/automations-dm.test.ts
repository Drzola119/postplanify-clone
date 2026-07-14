import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-auto";
const mockUid = "uid-auto";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockList = vi.fn();
const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/automations", () => ({
  listAutoDmCampaigns: mockList,
  createAutoDmCampaign: mockCreate,
  getAutoDmCampaign: mockGet,
  updateAutoDmCampaign: mockUpdate,
  deleteAutoDmCampaign: mockDelete,
}));

const { GET, POST } = await import("@/app/api/automations/dm/route");
const { GET: getOne, PATCH, DELETE } = await import("@/app/api/automations/dm/[id]/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  mockList.mockResolvedValue({ items: [], nextCursor: null });
  mockCreate.mockResolvedValue("campaign-1");
  mockGet.mockResolvedValue({ id: "campaign-1", status: "paused", template: "" });
});

describe("GET /api/automations/dm", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(401);
  });

  it("returns campaigns", async () => {
    mockList.mockResolvedValueOnce({ items: [{ id: "c1", name: "Test" }], nextCursor: null });
    const res = await GET(new Request("http://localhost/") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaigns).toHaveLength(1);
  });

  it("filters by active status", async () => {
    await GET(new Request("http://localhost/?status=active") as never);
    expect(mockList).toHaveBeenCalledWith(mockWorkspaceId, { status: "active" });
  });
});

describe("POST /api/automations/dm", () => {
  function postReq(body: unknown) {
    return new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  it("creates a campaign", async () => {
    const res = await POST(
      postReq({
        name: "Hi",
        status: "paused",
        trigger: { kind: "comment-keyword", keyword: "PRICE", match: "contains" },
        platforms: ["instagram"],
        template: "Hi!",
      }) as never,
    );
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
  });
  it("returns 400 for invalid payload", async () => {
    const res = await POST(postReq({ name: "x" }) as never);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/automations/dm/[id]", () => {
  it("returns campaign by id", async () => {
    const res = await getOne(new Request("http://localhost/") as never, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(200);
  });
  it("returns 404 when not found", async () => {
    mockGet.mockResolvedValueOnce(null);
    const res = await getOne(new Request("http://localhost/") as never, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/automations/dm/[id]", () => {
  it("updates status", async () => {
    mockUpdate.mockResolvedValueOnce(undefined);
    const req = new Request("http://localhost/", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(mockWorkspaceId, "c1", { status: "active" });
  });
  it("returns 404 when not found", async () => {
    mockGet.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/automations/dm/[id]", () => {
  it("deletes a campaign", async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    const res = await DELETE(new Request("http://localhost/", { method: "DELETE" }) as never, {
      params: Promise.resolve({ id: "c1" }),
    });
    expect(res.status).toBe(200);
  });
});
