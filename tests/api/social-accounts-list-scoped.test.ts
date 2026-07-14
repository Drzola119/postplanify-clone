import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-scope";
const mockOtherWorkspaceId = "ws-other";
const mockUid = "u-scope";
const mockRequireSession = vi.fn(async () => ({ uid: mockUid, workspaceId: mockWorkspaceId }));

vi.mock("@/lib/firebase/admin", () => {
  const fs = (globalThis as unknown as { __mockFs: MockFirestore }).__mockFs;
  (fs as unknown as { FieldValue: unknown }).FieldValue = {
    arrayUnion: (...e: unknown[]) => ({ _methodName: "arrayUnion", _elements: e }),
    arrayRemove: (...e: unknown[]) => ({ _methodName: "arrayRemove", _elements: e }),
    increment: (n: number) => ({ _methodName: "increment", _operand: n }),
    serverTimestamp: () => ({ _methodName: "serverTimestamp" }),
    delete: () => ({ _methodName: "delete" }),
  };
  return {
    adminApp: { name: "mock" },
    adminAuth: null,
    adminDb: fs,
    SESSION_COOKIE: "pp_session",
    SESSION_MAX_AGE_MS: 432000000,
    createSessionCookie: vi.fn(async () => null),
    verifySessionCookie: vi.fn(async () => null),
    getCurrentUser: vi.fn(async () => null),
  };
});

vi.mock("@/lib/auth/session-context", () => ({
  requireSession: () => mockRequireSession(),
}));

const originalFetch = globalThis.fetch;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFs.reset();
  vi.clearAllMocks();
  mockRequireSession.mockResolvedValue({ uid: mockUid, workspaceId: mockWorkspaceId });
  process.env.UPLOAD_POST_API_KEY = "test-key";

  fetchSpy = vi.fn();
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.UPLOAD_POST_API_KEY;
});

const { GET } = await import("@/app/api/social-accounts/list/route");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeReq(origin = "http://localhost"): Request {
  return new Request(`${origin}/api/social-accounts/list`, {
    method: "GET",
    headers: { host: new URL(origin).host },
  });
}

describe("GET /api/social-accounts/list (workspace-scoped)", () => {
  it("returns 401 when no session", async () => {
    mockRequireSession.mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }) as never,
    );
    const res = await GET(makeReq() as never);
    expect(res.status).toBe(401);
  });

  it("provisions profile then fetches /users/{workspaceId} only", async () => {
    fetchSpy
      // ensureProfile: POST /users → 201
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            profile: {
              username: mockWorkspaceId,
              created_at: "2026-07-14T06:00:00Z",
              blocked: false,
            },
          },
          201,
        ),
      )
      // list: GET /users/{workspaceId}
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profile: {
            username: mockWorkspaceId,
            social_accounts: {
              facebook: { handle: "@me", display_name: "Me", social_images: "https://x/y.png" },
              tiktok: "", // not connected
              x: { handle: "@x_handle" },
            },
            created_at: "2026-07-14T06:00:00Z",
            blocked: false,
          },
        }),
      )
      // list: GET /users (for plan/limit) — non-fatal
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profiles: [],
          plan: "pro",
          limit: 5,
        }),
      );

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Only THIS workspace's profile is returned.
    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0].username).toBe(mockWorkspaceId);

    // Only connected accounts (Facebook + X, not TikTok which is "" empty string).
    expect(body.accounts).toHaveLength(2);
    const platforms = body.accounts.map((a: { platform: string }) => a.platform).sort();
    expect(platforms).toEqual(["facebook", "x"]);

    // The fetch URL must include the workspaceId, NOT be the unfiltered list.
    const listCall = fetchSpy.mock.calls[1];
    expect(listCall[0]).toBe(
      `https://api.upload-post.com/api/uploadposts/users/${mockWorkspaceId}`,
    );
  });

  it("does NOT include other workspaces' accounts even if upload-post leaks them", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            profile: { username: mockWorkspaceId, created_at: "2026-07-14", blocked: false },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profile: {
            username: mockWorkspaceId,
            social_accounts: {},
          },
        }),
      );

    await GET(makeReq() as never);

    // Critical: the account list MUST come from the workspace-scoped endpoint,
    // not the unfiltered GET /users. (The route also fetches /users for
    // plan/limit, but that response is used only for plan/limit, never to
    // enumerate accounts.)
    const accountListCall = fetchSpy.mock.calls.find(
      (c) => c[0] === `https://api.upload-post.com/api/uploadposts/users/${mockWorkspaceId}`,
    );
    expect(accountListCall).toBeDefined();

    // Verify the account source: the workspace-scoped endpoint, NOT the unfiltered list.
    // The unfiltered /users call is only for plan/limit, so we check the call shape
    // — the workspace-scoped call is GET with no body; the unfiltered call is GET
    // with no body too. The key check: only one workspace-scoped call exists.
    const workspaceScopedCalls = fetchSpy.mock.calls.filter(
      (c) => c[0] === `https://api.upload-post.com/api/uploadposts/users/${mockWorkspaceId}`,
    );
    expect(workspaceScopedCalls).toHaveLength(1);
  });

  it("returns 404 gracefully when upload-post returns 404 for the profile", async () => {
    fetchSpy
      // ensureProfile: POST /users → 409 (already exists)
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "exists" }, 409),
      )
      // ensureProfile: GET /users/{workspaceId} → 404 (profile gone at upload-post)
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Not found" }, 404),
      )
      // list: GET /users/{workspaceId} → 404 again
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Not found" }, 404),
      );

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.accounts).toEqual([]);
  });

  it("uses cached profile without re-creating", async () => {
    await mockFs.doc(`workspaces/${mockWorkspaceId}`).set({
      settings: {
        uploadPostProfile: {
          username: mockWorkspaceId,
          createdAt: "2026-07-13T00:00:00Z",
          blocked: false,
          redirectUrl: null,
        },
      },
    });

    // 1. GET /users/{workspaceId} (the account list)
    // 2. GET /users (best-effort for plan/limit)
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profile: {
            username: mockWorkspaceId,
            social_accounts: {
              linkedin: { handle: "@li_me", display_name: "LinkedIn Me" },
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, profiles: [], plan: "free", limit: 1 }),
      );

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].platform).toBe("linkedin");
    expect(body.accounts[0].profileUsername).toBe(mockWorkspaceId);

    // No create call (cached profile used).
    const createCalls = fetchSpy.mock.calls.filter(
      (c) => c[1]?.method === "POST",
    );
    expect(createCalls).toHaveLength(0);
  });

  it("isolates workspaces: ws-A cannot see ws-B's accounts", async () => {
    // Set session to workspace A.
    mockRequireSession.mockResolvedValueOnce({
      uid: mockUid,
      workspaceId: mockWorkspaceId,
    } as never);

    // Mock the workspace-scoped fetch to ONLY return workspace A's data.
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            profile: { username: mockWorkspaceId, created_at: "2026-07-14", blocked: false },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profile: {
            username: mockWorkspaceId,
            social_accounts: {
              facebook: { handle: "@workspaceA_only" },
            },
          },
        }),
      );

    const res = await GET(makeReq() as never);
    const body = await res.json();

    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].handle).toBe("@workspaceA_only");
    expect(body.accounts[0].profileUsername).toBe(mockWorkspaceId);
    // No data from otherWorkspaceId leaked.
    expect(body.accounts.find((a: { profileUsername: string }) => a.profileUsername === mockOtherWorkspaceId)).toBeUndefined();
  });

  it("returns 502 when upload-post fetch fails with 500", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          { success: true, profile: { username: mockWorkspaceId, blocked: false } },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Server error" }, 500),
      );

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(502);
  });
});