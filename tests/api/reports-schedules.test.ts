import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRequireSession = vi.fn(async () => ({ uid: "u1", workspaceId: "ws1" }));
const mockUpdateSchedule = vi.fn(async () => undefined);
const mockDeleteSchedule = vi.fn(async () => undefined);

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));

vi.mock("@/lib/db/reports", () => ({
  updateSchedule: mockUpdateSchedule,
  deleteSchedule: mockDeleteSchedule,
}));

const { PATCH, DELETE } = await import("@/app/api/reports/schedules/[id]/route");

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: "u1", workspaceId: "ws1" });
});

describe("report schedule mutation routes", () => {
  it("updates a schedule in the current workspace", async () => {
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ paused: true, name: "Paused weekly" }),
        headers: { "Content-Type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "schedule-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockUpdateSchedule).toHaveBeenCalledWith("ws1", "schedule-1", { paused: true, name: "Paused weekly" });
  });

  it("deletes a schedule in the current workspace", async () => {
    const response = await DELETE(
      new Request("http://localhost", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "schedule-2" }) },
    );

    expect(response.status).toBe(200);
    expect(mockDeleteSchedule).toHaveBeenCalledWith("ws1", "schedule-2");
  });

  it("rejects an invalid schedule update", async () => {
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ recipients: ["not-an-email"] }),
        headers: { "Content-Type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "schedule-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mockUpdateSchedule).not.toHaveBeenCalled();
  });
});
