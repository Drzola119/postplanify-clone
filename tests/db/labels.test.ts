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

describe("db/labels - CRUD", () => {
  it("create + list returns the label", async () => {
    const { createLabel, listLabels } = await import("@/lib/db/labels");
    await createLabel("ws1", { name: "VIP" });
    const items = await listLabels("ws1");
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("VIP");
    expect(items[0].color).toBe("#6366f1");
  });

  it("update + list reflects change", async () => {
    const { createLabel, updateLabel, listLabels } = await import("@/lib/db/labels");
    const id = await createLabel("ws1", { name: "Old" });
    await updateLabel("ws1", id, { name: "New", color: "#ff0000" });
    const items = await listLabels("ws1");
    expect(items[0].name).toBe("New");
    expect(items[0].color).toBe("#ff0000");
  });

  it("delete removes the label", async () => {
    const { createLabel, deleteLabel, listLabels } = await import("@/lib/db/labels");
    const id = await createLabel("ws1", { name: "X" });
    await deleteLabel("ws1", id);
    const items = await listLabels("ws1");
    expect(items.length).toBe(0);
  });
});
