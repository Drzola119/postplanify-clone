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

describe("inbox sync tiers + claims", () => {
  it("tiers by recency: hot ≤7d, warm ≤30d, cold otherwise", async () => {
    const { tierFor } = await import("@/lib/db/inbox-sync");
    const now = new Date("2026-09-06T12:00:00.000Z");
    expect(tierFor(new Date("2026-09-05T12:00:00.000Z"), now)).toBe("hot");
    expect(tierFor(new Date("2026-08-20T12:00:00.000Z"), now)).toBe("warm");
    expect(tierFor(new Date("2026-01-01T00:00:00.000Z"), now)).toBe("cold");
    expect(tierFor(null, now)).toBe("cold");
  });

  it("claimDue coalesces rapid manual refreshes (throttle)", async () => {
    const { claimDue } = await import("@/lib/db/inbox-sync");
    const base = { accountKey: "prof", platform: "instagram" as const };
    expect(await claimDue("ws1", "scope-1", { ...base, force: true })).toBe(true);
    // Second manual claim within 60s is coalesced.
    expect(await claimDue("ws1", "scope-1", { ...base, force: true })).toBe(false);
  });

  it("recordSyncFailure backs off and recordSyncSuccess resets", async () => {
    const { recordSyncFailure, recordSyncSuccess, readSyncState } = await import("@/lib/db/inbox-sync");
    await recordSyncFailure("ws1", "scope-9", { code: "rate-limited", message: "slow down" });
    await recordSyncFailure("ws1", "scope-9", { code: "rate-limited", message: "slow down" });
    const failing = await readSyncState("ws1", "scope-9");
    expect(failing?.consecutiveFailures).toBe(2);
    expect(failing?.lastError?.code).toBe("rate-limited");
    await recordSyncSuccess("ws1", "scope-9", { tier: "hot" });
    const ok = await readSyncState("ws1", "scope-9");
    expect(ok?.consecutiveFailures).toBe(0);
    expect(ok?.tier).toBe("hot");
  });
});

describe("inbox sync worker (bounded + deduped)", () => {
  function stubFetch() {
    return vi.fn(async (url: string) => {
      const json = async () => {
        if (url.includes("/uploadposts/media")) {
          return {
            success: true,
            media: [
              {
                id: "media-1",
                caption: "launch",
                media_type: "IMAGE",
                permalink: "https://www.instagram.com/p/ABC/",
                timestamp: "2026-09-05T00:00:00+0000",
              },
            ],
            pagination: { next_cursor: null, has_more: false },
          };
        }
        if (url.includes("/uploadposts/comments")) {
          return {
            success: true,
            comments: [
              {
                id: "c-1",
                text: "love it",
                timestamp: "2026-09-05T01:00:00+0000",
                user: { id: "ig-u-9", username: "bob" },
              },
            ],
            pagination: { next_cursor: null, has_next: false },
          };
        }
        return { success: true, conversations: [] };
      };
      return { ok: true, status: 200, json } as unknown as Response;
    });
  }

  it("syncs comments with bounded provider calls and dedupes on re-run", async () => {
    const fetchMock = stubFetch();
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { syncInstagramAccount } = await import("@/lib/inbox/sync");
      const first = await syncInstagramAccount({ workspaceId: "ws1", accountKey: "prof", apiKey: "k" });
      expect(first.ok).toBe(true);
      expect(first.commentsUpserted).toBe(1);
      // 1 media page + 1 comment page + 1 conversation snapshot.
      expect(first.providerCalls).toBe(3);
      // Immediate re-run coalesces (no provider storm).
      const second = await syncInstagramAccount({ workspaceId: "ws1", accountKey: "prof", apiKey: "k" });
      expect(second.skipped).toBe("throttled");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
