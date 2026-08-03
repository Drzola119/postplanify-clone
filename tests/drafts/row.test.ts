import { describe, it, expect } from "vitest";
import {
  draftToRow,
  matchesSearch,
  sortDrafts,
  formatRowDateTime,
  type DraftRow,
  type DraftRecordLike,
} from "@/lib/drafts/row";

const baseRec: DraftRecordLike = {
  id: "draft-1",
  updatedAt: Date.parse("2026-06-23T16:11:00Z"),
  caption: "hello",
  selected: ["instagram", "tiktok"],
  mediaItems: [{ kind: "image", cdnUrl: "https://cdn.example.com/i.jpg" }],
};

describe("drafts/row - draftToRow", () => {
  it("maps a local record to a row with media + caption + platforms", () => {
    const row = draftToRow(baseRec);
    expect(row.id).toBe("draft-1");
    expect(row.caption).toBe("hello");
    expect(row.mediaType).toBe("image");
    expect(row.mediaUrl).toBe("https://cdn.example.com/i.jpg");
    expect(row.accounts.map((a) => a.platform)).toEqual(["instagram", "tiktok"]);
    expect(row.mediaCount).toBe(1);
  });

  it("uses the longest per-platform caption when captions map is provided", () => {
    const row = draftToRow({
      ...baseRec,
      caption: "short",
      captions: { instagram: "short", tiktok: "this is a much longer caption indeed" },
    });
    expect(row.caption).toBe("this is a much longer caption indeed");
  });

  it("falls back to the flat caption when captions map is empty", () => {
    const row = draftToRow({ ...baseRec, captions: {}, caption: "fallback" });
    expect(row.caption).toBe("fallback");
  });

  it("returns empty caption when nothing is set (does not leak tagUsers)", () => {
    const row = draftToRow({ ...baseRec, caption: "", captions: {}, tagUsers: "@alice @bob" });
    expect(row.caption).toBe("");
  });

  it("marks mediaType as 'none' when no media items", () => {
    const row = draftToRow({ ...baseRec, mediaItems: [] });
    expect(row.mediaType).toBe("none");
    expect(row.mediaUrl).toBeUndefined();
    expect(row.mediaCount).toBe(0);
  });

  it("falls back to url when cdnUrl/remoteUrl are missing", () => {
    const row = draftToRow({
      ...baseRec,
      mediaItems: [{ kind: "video", url: "https://cdn.example.com/v.mp4" }],
    });
    expect(row.mediaType).toBe("video");
    expect(row.mediaUrl).toBe("https://cdn.example.com/v.mp4");
  });

  it("prefers valid platforms and drops unknown ones", () => {
    const row = draftToRow({
      ...baseRec,
      // Cast through unknown so the type system allows an unknown platform
      // string to verify the runtime filter behaves defensively.
      selected: ["instagram", "mastodon", "facebook", "instagram"] as unknown as DraftRecordLike["selected"],
    });
    expect(row.accounts.map((a) => a.platform)).toEqual(["instagram", "facebook"]);
  });

  it("reads platforms from the API `platforms` field when `selected` is empty", () => {
    const row = draftToRow({
      ...baseRec,
      selected: [],
      platforms: ["twitter", "linkedin"],
    });
    expect(row.accounts.map((a) => a.platform)).toEqual(["twitter", "linkedin"]);
  });

  it("serializes numeric updatedAt to ISO", () => {
    const ts = Date.parse("2026-06-23T16:11:00Z");
    const row = draftToRow({ ...baseRec, updatedAt: ts });
    expect(row.updatedAt).toBe(new Date(ts).toISOString());
  });

  it("serializes ISO string updatedAt to ISO", () => {
    const row = draftToRow({ ...baseRec, updatedAt: "2026-06-23T16:11:00Z" });
    expect(row.updatedAt).toBe("2026-06-23T16:11:00.000Z");
  });

  it("replaces malformed updatedAt with current time rather than crashing", () => {
    const before = Date.now();
    const row = draftToRow({ ...baseRec, updatedAt: "not-a-date" });
    const after = Date.now();
    const t = Date.parse(row.updatedAt);
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });

  it("resolves handle from the platform metadata", () => {
    const row = draftToRow({ ...baseRec, selected: ["youtube"] });
    expect(row.accounts[0].handle).toBe("Zakaria 11");
  });

  it("falls back to empty handle when the platform has no default handle", () => {
    const row = draftToRow({ ...baseRec, selected: ["discord"] });
    expect(row.accounts[0].handle).toBe("");
  });
});

describe("drafts/row - matchesSearch", () => {
  const row: DraftRow = draftToRow(baseRec);

  it("returns true for empty query", () => {
    expect(matchesSearch(row, "")).toBe(true);
    expect(matchesSearch(row, "   ")).toBe(true);
  });

  it("matches caption text case-insensitively", () => {
    expect(matchesSearch(row, "HELLO")).toBe(true);
  });

  it("matches account handle", () => {
    expect(matchesSearch(row, "nicklorance7")).toBe(true);
  });

  it("matches platform display name", () => {
    expect(matchesSearch(row, "Instagram")).toBe(true);
    expect(matchesSearch(row, "TikTok")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesSearch(row, "no-such-thing")).toBe(false);
  });
});

describe("drafts/row - sortDrafts", () => {
  const a: DraftRow = draftToRow({ ...baseRec, id: "a", updatedAt: Date.parse("2026-01-01T00:00:00Z") });
  const b: DraftRow = draftToRow({ ...baseRec, id: "b", updatedAt: Date.parse("2026-06-01T00:00:00Z") });
  const c: DraftRow = draftToRow({ ...baseRec, id: "c", updatedAt: Date.parse("2026-03-01T00:00:00Z") });

  it("sorts recent-first by updatedAt", () => {
    expect(sortDrafts([a, b, c], "recent").map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts oldest-first by updatedAt", () => {
    expect(sortDrafts([a, b, c], "oldest").map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts A→Z by caption locale", () => {
    const x: DraftRow = { ...a, caption: "banana" };
    const y: DraftRow = { ...b, caption: "apple" };
    const z: DraftRow = { ...c, caption: "cherry" };
    expect(sortDrafts([x, y, z], "az").map((r) => r.caption)).toEqual(["apple", "banana", "cherry"]);
  });

  it("does not mutate the input array", () => {
    const input = [a, b, c];
    const before = input.map((r) => r.id);
    sortDrafts(input, "recent");
    expect(input.map((r) => r.id)).toEqual(before);
  });
});

describe("drafts/row - formatRowDateTime", () => {
  it("produces a non-empty date and a 24h time for a valid ISO", () => {
    const iso = "2026-06-23T16:11:00Z";
    const out = formatRowDateTime(iso, "en-US");
    expect(out.date).toMatch(/Jun/);
    // Time is rendered in the runtime's local timezone, so compute the
    // expected value from the same `Date` to stay zone-agnostic.
    const expected = new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    expect(out.time).toBe(expected);
  });

  it("returns an em-dash when the input is malformed", () => {
    expect(formatRowDateTime("not-a-date").date).toBe("—");
  });
});
