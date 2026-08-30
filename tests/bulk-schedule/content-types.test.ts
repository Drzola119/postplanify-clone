import { describe, expect, it } from "vitest";
import { acceptsMediaKind, normalizeBulkContentType, platformsForBulkContent } from "@/lib/bulk-schedule/content-types";

describe("bulk content platform auto-selection", () => {
  it("selects only text-capable platforms for text posts", () => {
    expect(platformsForBulkContent("text")).toEqual([
      "linkedin", "twitter", "facebook", "threads", "reddit", "bluesky", "discord", "telegram", "google_business",
    ]);
  });

  it("targets the four short-form video destinations", () => {
    expect(platformsForBulkContent("short_video")).toEqual(["instagram", "facebook", "tiktok", "youtube"]);
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
