import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-inbox";
const mockUid = "uid-inbox";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockUpdateCommentSentiment = vi.fn();
const mockAdminDbUpdate = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/inbox", () => ({
  updateCommentSentiment: (...args: unknown[]) => mockUpdateCommentSentiment(...args),
}));
vi.mock("@/lib/db", () => ({
  adminDb: {
    doc: () => ({ update: (...args: unknown[]) => mockAdminDbUpdate(...args) }),
  },
}));

const { PATCH, DELETE } = await import("@/app/api/inbox/comments/[id]/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

function makeReq(body: unknown, method = "PATCH") {
  return new Request("http://localhost/", {
    method,
    headers: { "content-type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify(body),
  });
}

const ctx = () => ({ params: Promise.resolve({ id: "c1" }) });

describe("PATCH /api/inbox/comments/[id]", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await PATCH(makeReq({ sentiment: "positive" }) as never, ctx());
    expect(res.status).toBe(401);
  });

  it("updates sentiment", async () => {
    mockUpdateCommentSentiment.mockResolvedValueOnce(undefined);
    const res = await PATCH(makeReq({ sentiment: "positive" }) as never, ctx());
    expect(res.status).toBe(200);
    expect(mockUpdateCommentSentiment).toHaveBeenCalledWith(mockWorkspaceId, "c1", "positive");
  });

  it("updates labels when provided", async () => {
    mockAdminDbUpdate.mockResolvedValueOnce(undefined);
    const res = await PATCH(makeReq({ labels: ["vip", "lead"] }) as never, ctx());
    expect(res.status).toBe(200);
    expect(mockAdminDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["vip", "lead"] }),
    );
  });

  it("returns 400 for invalid sentiment", async () => {
    const res = await PATCH(makeReq({ sentiment: "happy" }) as never, ctx());
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/inbox/comments/[id]", () => {
  it("soft-deletes (archives) a comment", async () => {
    mockAdminDbUpdate.mockResolvedValueOnce(undefined);
    const res = await DELETE(makeReq({}, "DELETE") as never, ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.archived).toBe(true);
  });
});
