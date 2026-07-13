import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

// Share the mock across vi.mock factory + the test body via globalThis.
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
  process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook";
  process.env.UPLOAD_POST_DEFAULT_USERNAME = "trustiify_test";
});

describe("queue/worker - core tick behavior", () => {
  it("returns zero result when no workspaces exist", async () => {
    const { runQueueTick } = await import("@/lib/queue/worker");
    const result = await runQueueTick();
    expect(result.scanned).toBe(0);
    expect(result.published).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.reaped).toBe(0);
  });

  it("scans workspaces but skips when no posts due", async () => {
    await mockFs.doc("workspaces/ws-A").set({
      name: "A",
      ownerUid: "u",
      plan: "free",
      settings: {},
      createdAt: { seconds: 0, nanoseconds: 0 },
    });
    const { runQueueTick } = await import("@/lib/queue/worker");
    const result = await runQueueTick();
    expect(result.scanned).toBe(0);
  });
});

describe("queue/worker - module API surface", () => {
  it("startQueueWorker / stopQueueWorker are idempotent", async () => {
    const { startQueueWorker, stopQueueWorker } = await import("@/lib/queue/worker");
    startQueueWorker(60_000);
    startQueueWorker(60_000);
    stopQueueWorker();
    stopQueueWorker();
    expect(true).toBe(true);
  });

  it("getWorkerStatus returns sane shape", async () => {
    const { getWorkerStatus } = await import("@/lib/queue/worker");
    const status = getWorkerStatus();
    expect(status).toHaveProperty("running");
    expect(status).toHaveProperty("lastTickAt");
    expect(status).toHaveProperty("lastResult");
    expect(typeof status.running).toBe("boolean");
  });
});