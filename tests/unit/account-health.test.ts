import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deriveHealth, type CachedSnapshot } from "@/lib/db/account-health";

describe("deriveHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty snapshot when cache is null", () => {
    const h = deriveHealth(null);
    expect(h.total).toBe(0);
    expect(h.healthy).toBe(0);
    expect(h.isStale).toBe(true);
  });

  it("returns empty snapshot when accounts list is empty", () => {
    const h = deriveHealth({ accounts: [], profiles: [], plan: null, limit: null, fetchedAt: new Date().toISOString() });
    expect(h.total).toBe(0);
    expect(h.isStale).toBe(false);
  });

  it("marks account as healthy when no flags and fresh", () => {
    const fetchedAt = new Date().toISOString();
    const h = deriveHealth({
      accounts: [{ id: "x:instagram", profileUsername: "x", platform: "instagram", handle: "@me", displayName: null, img: null, reauthRequired: false }],
      profiles: [],
      plan: null,
      limit: null,
      fetchedAt,
    });
    expect(h.total).toBe(1);
    expect(h.healthy).toBe(1);
    expect(h.accounts[0].status).toBe("healthy");
  });

  it("marks reauthRequired as needs_reauth", () => {
    const h = deriveHealth({
      accounts: [{ id: "x:ig", profileUsername: "x", platform: "instagram", handle: "@me", displayName: null, img: null, reauthRequired: true }],
      profiles: [],
      plan: null,
      limit: null,
      fetchedAt: new Date().toISOString(),
    });
    expect(h.accounts[0].status).toBe("needs_reauth");
    expect(h.needsReauth).toBe(1);
  });

  it("marks missing handle as disconnected", () => {
    const h = deriveHealth({
      accounts: [{ id: "x:ig", profileUsername: "x", platform: "instagram", handle: "", displayName: null, img: null, reauthRequired: false }],
      profiles: [],
      plan: null,
      limit: null,
      fetchedAt: new Date().toISOString(),
    });
    expect(h.accounts[0].status).toBe("disconnected");
    expect(h.disconnected).toBe(1);
  });

  it("marks snapshot older than 24h as stale (and all healthy accounts become stale)", () => {
    const oldFetch = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const h = deriveHealth({
      accounts: [{ id: "x:ig", profileUsername: "x", platform: "instagram", handle: "@me", displayName: null, img: null, reauthRequired: false }],
      profiles: [],
      plan: null,
      limit: null,
      fetchedAt: oldFetch,
    });
    expect(h.isStale).toBe(true);
    expect(h.accounts[0].status).toBe("stale");
    expect(h.stale).toBe(1);
  });

  it("aggregates counts across multiple accounts", () => {
    const h = deriveHealth({
      accounts: [
        { id: "a:ig", profileUsername: "a", platform: "instagram", handle: "@a", displayName: null, img: null, reauthRequired: false },
        { id: "a:tw", profileUsername: "a", platform: "x", handle: "@b", displayName: null, img: null, reauthRequired: true },
        { id: "b:ig", profileUsername: "b", platform: "instagram", handle: "", displayName: null, img: null, reauthRequired: false },
        { id: "c:ig", profileUsername: "c", platform: "instagram", handle: "@c", displayName: null, img: null, reauthRequired: false },
      ],
      profiles: [],
      plan: null,
      limit: null,
      fetchedAt: new Date().toISOString(),
    });
    expect(h.total).toBe(4);
    expect(h.healthy).toBe(2);
    expect(h.needsReauth).toBe(1);
    expect(h.disconnected).toBe(1);
  });
});