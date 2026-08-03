import { describe, it, expect } from "vitest";
import {
  normalizeStatus,
  normalizePlatforms,
  postMatchesFilters,
  comparePostsChronologically,
  groupPostsByDay,
  weekBounds,
  monthGridStart,
  fmtISO,
  isSameDay,
  formatInZone,
  parseISODate,
  type CalendarPost,
} from "@/lib/posts/calendar";

const basePost: CalendarPost = {
  id: "p1",
  status: "scheduled",
  caption: "hello world",
  platforms: ["twitter"],
  mediaUrls: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  scheduledAt: "2026-06-15T10:00:00.000Z",
};

describe("posts/calendar - normalizeStatus", () => {
  it("accepts known statuses", () => {
    for (const s of ["draft", "queued", "scheduled", "publishing", "published", "partially_published", "failed", "archived", "paused"]) {
      expect(normalizeStatus(s)).toBe(s);
    }
  });
  it("falls back to draft for unknown", () => {
    expect(normalizeStatus("unknown")).toBe("draft");
    expect(normalizeStatus(null)).toBe("draft");
    expect(normalizeStatus(42)).toBe("draft");
  });
});

describe("posts/calendar - normalizePlatforms", () => {
  it("dedupes and filters unknown", () => {
    expect(normalizePlatforms(["twitter", "mastodon", "twitter", "bluesky"])).toEqual(["twitter", "bluesky"]);
  });
  it("returns [] on non-array", () => {
    expect(normalizePlatforms(null)).toEqual([]);
    expect(normalizePlatforms("twitter")).toEqual([]);
  });
});

describe("posts/calendar - postMatchesFilters", () => {
  const image: CalendarPost = { ...basePost, mediaUrls: ["https://cdn/a.png"] };
  const video: CalendarPost = { ...basePost, mediaUrls: ["https://cdn/a.mp4"] };
  const mixed: CalendarPost = { ...basePost, mediaUrls: ["https://cdn/a.jpg", "https://cdn/b.mp4"] };
  const text: CalendarPost = { ...basePost, mediaUrls: [] };

  it("filters by search (case-insensitive caption)", () => {
    expect(postMatchesFilters(basePost, { search: "HELLO" })).toBe(true);
    expect(postMatchesFilters(basePost, { search: "nope" })).toBe(false);
  });
  it("filters by status", () => {
    expect(postMatchesFilters(basePost, { status: "scheduled" })).toBe(true);
    expect(postMatchesFilters(basePost, { status: "failed" })).toBe(false);
    expect(postMatchesFilters(basePost, { status: "all" })).toBe(true);
  });
  it("filters by platform", () => {
    expect(postMatchesFilters(basePost, { platform: "twitter" })).toBe(true);
    expect(postMatchesFilters(basePost, { platform: "instagram" })).toBe(false);
  });
  it("filters by mediaKind", () => {
    expect(postMatchesFilters(image, { mediaKind: "image" })).toBe(true);
    expect(postMatchesFilters(video, { mediaKind: "video" })).toBe(true);
    expect(postMatchesFilters(mixed, { mediaKind: "image" })).toBe(true);
    expect(postMatchesFilters(text, { mediaKind: "image" })).toBe(false);
    expect(postMatchesFilters(text, { mediaKind: "text" })).toBe(true);
  });
  it("filters by fromDate/toDate on scheduledAt", () => {
    expect(postMatchesFilters(basePost, { fromDate: "2026-06-01" })).toBe(true);
    expect(postMatchesFilters(basePost, { toDate: "2026-06-30" })).toBe(true);
    expect(postMatchesFilters(basePost, { fromDate: "2026-07-01" })).toBe(false);
  });
});

describe("posts/calendar - comparePostsChronologically", () => {
  it("orders by scheduledAt desc", () => {
    const a = { ...basePost, id: "a", scheduledAt: "2026-06-15T10:00:00.000Z" };
    const b = { ...basePost, id: "b", scheduledAt: "2026-06-16T10:00:00.000Z" };
    const sorted = [a, b].sort(comparePostsChronologically);
    expect(sorted.map((p) => p.id)).toEqual(["b", "a"]);
  });
  it("falls back to createdAt", () => {
    const a: CalendarPost = { ...basePost, id: "a", scheduledAt: undefined, createdAt: "2026-06-01T00:00:00.000Z" };
    const b: CalendarPost = { ...basePost, id: "b", scheduledAt: undefined, createdAt: "2026-05-01T00:00:00.000Z" };
    const sorted = [a, b].sort(comparePostsChronologically);
    expect(sorted.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("posts/calendar - groupPostsByDay", () => {
  it("buckets by scheduledAt YYYY-MM-DD", () => {
    const a: CalendarPost = { ...basePost, id: "a", scheduledAt: "2026-06-15T08:00:00.000Z" };
    const b: CalendarPost = { ...basePost, id: "b", scheduledAt: "2026-06-15T20:00:00.000Z" };
    const c: CalendarPost = { ...basePost, id: "c", scheduledAt: "2026-06-16T10:00:00.000Z" };
    const g = groupPostsByDay([a, b, c]);
    expect(Object.keys(g).sort()).toEqual(["2026-06-15", "2026-06-16"]);
    expect(g["2026-06-15"].map((p) => p.id).sort()).toEqual(["a", "b"]);
  });
});

describe("posts/calendar - weekBounds", () => {
  it("returns Monday → next Monday for mid-week", () => {
    const wed = new Date(2026, 5, 17);
    const { start, end } = weekBounds(wed);
    expect(start.getDay()).toBe(1);
    expect(fmtISO(start)).toBe("2026-06-15");
    expect(fmtISO(end)).toBe("2026-06-22");
  });
  it("handles Sunday", () => {
    const sun = new Date(2026, 5, 21);
    const { start } = weekBounds(sun);
    expect(fmtISO(start)).toBe("2026-06-15");
  });
});

describe("posts/calendar - monthGridStart", () => {
  it("returns the Monday of the week containing the 1st", () => {
    const d = new Date(2026, 5, 15);
    expect(fmtISO(monthGridStart(d))).toBe("2026-06-01");
  });
});

describe("posts/calendar - isSameDay", () => {
  it("compares by calendar day", () => {
    expect(isSameDay(new Date(2026, 5, 15, 9), new Date(2026, 5, 15, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 5, 15), new Date(2026, 5, 16))).toBe(false);
  });
});

describe("posts/calendar - formatInZone", () => {
  it("formats UTC instant in the chosen zone", () => {
    const r = formatInZone("2026-06-15T10:00:00.000Z", "UTC");
    expect(r).toEqual({ date: "2026-06-15", time: "10:00" });
  });
  it("shifts the date for non-UTC zones", () => {
    const r = formatInZone("2026-06-15T03:00:00.000Z", "America/Los_Angeles");
    expect(r.date).toBe("2026-06-14");
    expect(r.time).toBe("20:00");
  });
  it("handles missing/unparseable", () => {
    expect(formatInZone(undefined, "UTC")).toEqual({ date: "", time: "" });
    expect(formatInZone("not-a-date", "UTC")).toEqual({ date: "", time: "" });
  });
});

describe("posts/calendar - parseISODate", () => {
  it("parses YYYY-MM-DD into a local Date", () => {
    const d = parseISODate("2026-06-15");
    expect(d).not.toBeNull();
    expect(fmtISO(d!)).toBe("2026-06-15");
  });
  it("returns null on malformed", () => {
    expect(parseISODate("")).toBeNull();
    expect(parseISODate("2026/06/15")).toBeNull();
    expect(parseISODate("2026-13-01")).toBeNull();
  });
});
