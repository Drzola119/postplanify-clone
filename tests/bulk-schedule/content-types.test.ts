import { describe, expect, it } from "vitest";
import { acceptsMediaKind, normalizeBulkContentType, platformsForBulkContent } from "@/lib/bulk-schedule/content-types";

describe("bulk content platform auto-selection", () => {
  it("selects only text-capable platforms for text posts", () => {
    expect(platformsForBulkContent("text")).toEqual([
      "linkedin", "twitter", "facebook", "threads", "reddit", "bluesky", "discord", "telegram", "google_business",
    ]);
  });

  it("targets all video-capable destinations for short_video and long_video", () => {
    const shorts = platformsForBulkContent("short_video");
    expect(shorts).toContain("youtube");
    expect(shorts).toContain("instagram");
    expect(shorts).toContain("facebook");
    expect(shorts).toContain("tiktok");
    expect(shorts).toContain("twitter");
    expect(shorts).toContain("threads");
    expect(shorts).toContain("pinterest");
    expect(shorts).toContain("linkedin");
    expect(shorts).toContain("bluesky");
    expect(shorts).toContain("reddit");
    expect(shorts).toContain("telegram");
    expect(shorts).toContain("discord");
    expect(shorts).toContain("google_business");

    const longs = platformsForBulkContent("long_video");
    expect(longs).toContain("youtube");
    expect(longs).toContain("instagram");
    expect(longs).toContain("facebook");
    expect(longs).toContain("tiktok");
    expect(longs).toContain("twitter");
    expect(longs).toContain("threads");
    expect(longs).toContain("pinterest");
    expect(longs).toContain("linkedin");
  });

  it("limits stories and X community posts to documented destinations", () => {
    expect(platformsForBulkContent("story")).toEqual(["instagram", "facebook"]);
    expect(platformsForBulkContent("community")).toEqual(["twitter"]);
  });

  it("changes carousel destinations by media composition", () => {
    expect(platformsForBulkContent("carousel", "images")).toContain("facebook");
    expect(platformsForBulkContent("carousel", "videos")).toEqual(["instagram", "threads"]);
    expect(platformsForBulkContent("carousel", "mixed")).toEqual(["instagram", "threads"]);
  });

  it("gates uploads to the chosen content format", () => {
    expect(acceptsMediaKind("long_video", "image")).toBe(false);
    expect(acceptsMediaKind("story", "image")).toBe(true);
    expect(acceptsMediaKind("carousel", "video", "images")).toBe(false);
    expect(acceptsMediaKind("carousel", "video", "mixed")).toBe(true);
  });

  it("normalizes CSV-friendly content type aliases", () => {
    expect(normalizeBulkContentType("Shorts-Reels")).toBe("short_video");
    expect(normalizeBulkContentType("X Community")).toBe("community");
    expect(normalizeBulkContentType("unknown")).toBeNull();
  });
});
