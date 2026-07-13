import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const SESSION = { uid: "u1", email: "u1@test", workspaceId: "ws1" };

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
  requireSession: vi.fn(async () => SESSION),
}));

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
});

function makeRequest(url: string, body?: unknown, method = "GET"): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

describe("api/destinations - GET", () => {
  it("returns empty list", async () => {
    const { GET } = await import("@/app/api/destinations/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.destinations).toEqual([]);
  });
});

describe("api/destinations - POST", () => {
  it("creates a destination and returns 201", async () => {
    const { POST } = await import("@/app/api/destinations/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/destinations",
        { platform: "custom", type: "webhook", url: "https://x.example.com/h" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
  });

  it("rejects non-http url", async () => {
    const { POST } = await import("@/app/api/destinations/route");
    const res = await POST(
      makeRequest(
        "https://x.test/api/destinations",
        { platform: "custom", type: "webhook", url: "ftp://x" },
        "POST"
      ) as never
    );
    expect(res.status).toBe(400);
  });
});
