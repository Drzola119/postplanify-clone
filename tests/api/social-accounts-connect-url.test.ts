import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

const mockWorkspaceId = "ws-test-1";
const mockUid = "u-test-1";
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

const { GET: connectUrlGet, POST: connectUrlPost } = await import(
  "@/app/api/social-accounts/connect-url/route"
);

function makeReq(origin = "http://localhost"): Request {
  return new Request(`${origin}/api/social-accounts/connect-url`, {
    method: "GET",
    headers: { host: new URL(origin).host },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/social-accounts/connect-url", () => {
  it("returns 401 when no session", async () => {
    mockRequireSession.mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }) as never,
    );
    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(401);
  });

  it("returns 500 when UPLOAD_POST_API_KEY missing", async () => {
    delete process.env.UPLOAD_POST_API_KEY;
    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/UPLOAD_POST_API_KEY/);
  });

  it("provisions a workspace profile then generates JWT URL", async () => {
    fetchSpy
      // Step 1: POST /api/uploadposts/users → create profile (201)
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
      // Step 2: POST /api/uploadposts/users/generate-jwt (200)
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          access_url: "https://app.upload-post.com/u/eyJ0eXAi...",
          duration: 172800,
        }),
      );

    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.url).toMatch(/^https:\/\/app\.upload-post\.com\/u\//);
    expect(body.redirectUrl).toContain("/dashboard/accounts?connected=1");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://api.upload-post.com/api/uploadposts/users",
    );
    expect(fetchSpy.mock.calls[1][0]).toBe(
      "https://api.upload-post.com/api/uploadposts/users/generate-jwt",
    );

    const createBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(createBody).toEqual({ username: mockWorkspaceId });

    const jwtBody = JSON.parse(fetchSpy.mock.calls[1][1].body);
    expect(jwtBody.username).toBe(mockWorkspaceId);
    expect(jwtBody.redirect_url).toContain("/dashboard/accounts?connected=1");
    expect(jwtBody.platforms).toContain("facebook");
    expect(jwtBody.platforms).toContain("tiktok");
    expect(jwtBody.show_calendar).toBe(false);

    // Profile is cached in workspace settings.
    const profile = await mockFs.doc(`workspaces/${mockWorkspaceId}`).get();
    const data = profile.data() as Record<string, unknown>;
    const settings = (data.settings ?? {}) as Record<string, unknown>;
    expect(settings.uploadPostProfile).toMatchObject({
      username: mockWorkspaceId,
      blocked: false,
    });
  });

  it("uses existing profile on subsequent calls (no re-create)", async () => {
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

    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        access_url: "https://app.upload-post.com/u/jwt2",
        duration: 172800,
      }),
    );

    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://api.upload-post.com/api/uploadposts/users/generate-jwt",
    );
  });

  it("falls back to GET /users/{username} when create returns 409", async () => {
    fetchSpy
      // POST /users → 409 conflict
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Profile already exists" }, 409),
      )
      // GET /users/{username} → fetch existing
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          profile: {
            username: mockWorkspaceId,
            created_at: "2026-07-10T00:00:00Z",
            blocked: false,
          },
        }),
      )
      // POST /users/generate-jwt
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          access_url: "https://app.upload-post.com/u/jwt3",
          duration: 172800,
        }),
      );

    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    const profile = await mockFs.doc(`workspaces/${mockWorkspaceId}`).get();
    const data = profile.data() as Record<string, unknown>;
    const settings = (data.settings ?? {}) as Record<string, unknown>;
    expect(settings.uploadPostProfile).toMatchObject({
      username: mockWorkspaceId,
    });
  });

  it("returns 502 when upload-post generate-jwt fails", async () => {
    fetchSpy
      // Create profile
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            profile: { username: mockWorkspaceId, created_at: "2026-07-14" },
          },
          201,
        ),
      )
      // JWT fails
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: "Rate limit exceeded" }, 429),
      );

    const res = await connectUrlGet(makeReq() as never);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/Rate limit/);
  });

  it("POST is supported and behaves like GET", async () => {
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

    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        access_url: "https://app.upload-post.com/u/jwt-post",
        duration: 172800,
      }),
    );

    const req = new Request("http://localhost/api/social-accounts/connect-url", {
      method: "POST",
    });
    const res = await connectUrlPost(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://app.upload-post.com/u/jwt-post");
  });
});