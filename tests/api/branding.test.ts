import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-branding";
const mockUid = "u-branding";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));

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

const { GET, PATCH } = await import("@/app/api/branding/route");

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
});

function patchReq(body: unknown): Request {
  return new Request("http://localhost/api/branding", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/branding", () => {
  it("returns defaults when workspace has no settings yet", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.branding).toMatchObject({
      brandName: "",
      logoUrl: "",
      primaryColor: "#0f172a",
      customDomain: "",
      whiteLabelEnabled: false,
      footerText: "",
      hidePoweredBy: false,
    });
  });

  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("falls back to workspace name for brandName", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}`).set({ name: "Acme Marketing" });
    const res = await GET();
    const body = await res.json();
    expect(body.branding.brandName).toBe("Acme Marketing");
  });

  it("returns stored settings when present", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}`).set({
      name: "Acme",
      settings: {
        brandName: "Acme Brand",
        primaryColor: "#ff5500",
        whiteLabelEnabled: true,
        hidePoweredBy: true,
      },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.branding.brandName).toBe("Acme Brand");
    expect(body.branding.primaryColor).toBe("#ff5500");
    expect(body.branding.whiteLabelEnabled).toBe(true);
    expect(body.branding.hidePoweredBy).toBe(true);
  });
});

describe("PATCH /api/branding", () => {
  it("merges valid branding fields into workspace settings", async () => {
    const res = await PATCH(
      patchReq({
        brandName: "Acme",
        primaryColor: "#3366ff",
        whiteLabelEnabled: true,
      }) as never,
    );
    expect(res.status).toBe(200);
    const snap = await mockFs.doc(`workspaces/${mockWorkspaceId}`).get();
    const data = snap.data() as Record<string, unknown>;
    const settings = data.settings as Record<string, unknown>;
    expect(settings.brandName).toBe("Acme");
    expect(settings.primaryColor).toBe("#3366ff");
    expect(settings.whiteLabelEnabled).toBe(true);
  });

  it("rejects brandName over 80 chars", async () => {
    const res = await PATCH(patchReq({ brandName: "x".repeat(100) }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid color", async () => {
    const res = await PATCH(patchReq({ primaryColor: "rgb(1,2,3)" }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid logo url", async () => {
    const res = await PATCH(patchReq({ logoUrl: "not-a-url" }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects customDomain with invalid chars", async () => {
    const res = await PATCH(patchReq({ customDomain: "bad domain!.com" }) as never);
    expect(res.status).toBe(400);
  });

  it("accepts empty strings for url/domain fields", async () => {
    const res = await PATCH(patchReq({ logoUrl: "", customDomain: "" }) as never);
    expect(res.status).toBe(200);
  });

  it("returns 401 when session missing", async () => {
    mockRequireSession.mockResolvedValueOnce(new Response("nope", { status: 401 }) as never);
    const res = await PATCH(patchReq({ brandName: "X" }) as never);
    expect(res.status).toBe(401);
  });
});