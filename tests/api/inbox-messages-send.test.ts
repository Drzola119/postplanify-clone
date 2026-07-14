import { describe, it, expect, beforeEach, vi } from "vitest";

const mockWorkspaceId = "ws-ms";
const mockUid = "uid-ms";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));
const mockSendMessage = vi.fn();

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));
vi.mock("@/lib/db/inbox", () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

const { POST } = await import("@/app/api/inbox/messages/send/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  mockSendMessage.mockResolvedValue("msg-1");
});

function makeReq(body: unknown) {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/inbox/messages/send", () => {
  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await POST(makeReq({ conversationId: "c1", body: "hi" }) as never);
    expect(res.status).toBe(401);
  });

  it("sends an outbound message", async () => {
    const res = await POST(makeReq({ conversationId: "c1", body: "hello" }) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("msg-1");
    expect(mockSendMessage).toHaveBeenCalledWith(mockWorkspaceId, "c1", "hello", "out");
  });

  it("supports direction=in for inbound messages", async () => {
    await POST(makeReq({ conversationId: "c1", body: "incoming", direction: "in" }) as never);
    expect(mockSendMessage).toHaveBeenCalledWith(mockWorkspaceId, "c1", "incoming", "in");
  });

  it("returns 400 for missing body", async () => {
    const res = await POST(makeReq({ conversationId: "c1" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty conversationId", async () => {
    const res = await POST(makeReq({ conversationId: "", body: "hi" }) as never);
    expect(res.status).toBe(400);
  });
});
