import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

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

beforeEach(() => {
  mockFs.reset();
});

describe("db/reports - reports CRUD", () => {
  it("create + list returns the report", async () => {
    const { createReport, listReports } = await import("@/lib/db/reports");
    await createReport("ws1", {
      name: "Q1",
      template: "performance",
      dateRange: { from: new Date("2026-01-01"), to: new Date("2026-03-31") },
    });
    const items = await listReports("ws1");
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("Q1");
    expect(items[0].status).toBe("pending");
  });

  it("update flips status to ready", async () => {
    const { createReport, updateReport, listReports } = await import("@/lib/db/reports");
    const id = await createReport("ws1", {
      name: "Q2",
      template: "engagement",
      dateRange: { from: "2026-04-01", to: "2026-06-30" },
    });
    await updateReport("ws1", id, { status: "ready", downloadUrl: "https://x.com/r.pdf" });
    const items = await listReports("ws1");
    expect(items[0].status).toBe("ready");
    expect(items[0].downloadUrl).toBe("https://x.com/r.pdf");
    expect(items[0].generatedAt).toBeTruthy();
  });

  it("delete removes the report", async () => {
    const { createReport, deleteReport, listReports } = await import("@/lib/db/reports");
    const id = await createReport("ws1", {
      name: "X",
      template: "audience",
      dateRange: { from: "2026-01-01", to: "2026-01-31" },
    });
    await deleteReport("ws1", id);
    expect((await listReports("ws1")).length).toBe(0);
  });
});

describe("db/reports - schedules CRUD", () => {
  it("create + pause + list", async () => {
    const { createSchedule, listSchedules, pauseSchedule } = await import("@/lib/db/reports");
    const id = await createSchedule("ws1", {
      name: "Weekly",
      cron: "0 9 * * 1",
      recipients: ["me@example.com"],
    });
    let items = await listSchedules("ws1");
    expect(items[0].paused).toBe(false);
    await pauseSchedule("ws1", id, true);
    items = await listSchedules("ws1");
    expect(items[0].paused).toBe(true);
  });
});
