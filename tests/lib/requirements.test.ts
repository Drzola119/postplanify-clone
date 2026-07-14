import { describe, it, expect } from "vitest";
import { checkRequirements, publishablePlatforms } from "@/lib/publishing/requirements";
import type { PlatformId } from "@/lib/platforms";

describe("lib/publishing/requirements", () => {
  it("returns ready when caption + media + targets are all valid", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hello world" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("ready");
    expect(report.readyCount).toBe(1);
    expect(report.blockedCount).toBe(0);
  });

  it("blocks when there is no media", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hello" } as Record<PlatformId, string>,
      media: [],
      advancedByPlatform: {},
      composerMediaKind: "text",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "missing_media")).toBe(true);
  });

  it("blocks when caption exceeds the platform limit", () => {
    const report = checkRequirements(["threads"], {
      captionByPlatform: {
        threads: "a".repeat(600), // threads allows 500
      } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "caption_too_long")).toBe(true);
  });

  it("warns (not blocks) when caption is between 90% and 100% of the limit", () => {
    const report = checkRequirements(["threads"], {
      captionByPlatform: {
        threads: "a".repeat(460), // 460/500 ≈ 92%
      } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("warning");
    expect(report.perPlatform[0].issues.some((i) => i.code === "caption_near_limit")).toBe(true);
  });

  it("blocks when a video-only platform receives an image", () => {
    const report = checkRequirements(["youtube"], {
      captionByPlatform: { youtube: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "image_not_supported")).toBe(true);
  });

  it("blocks when image is over the platform's byte limit", () => {
    const report = checkRequirements(["bluesky"], {
      captionByPlatform: { bluesky: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 5_000_000 }], // > 1MB
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "image_too_large")).toBe(true);
  });

  it("blocks when image mime type is not in the allowed list", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/bmp", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "image_wrong_format")).toBe(true);
  });

  it("blocks when video duration is below the platform minimum", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "video", mimeType: "video/mp4", sizeBytes: 1_000_000, durationSec: 1 }],
      advancedByPlatform: {},
      composerMediaKind: "video",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "video_bad_duration")).toBe(true);
  });

  it("blocks when an image-only post exceeds the per-post item limit", () => {
    const media = Array.from({ length: 6 }, () => ({
      kind: "image" as const,
      mimeType: "image/jpeg",
      sizeBytes: 100_000,
    }));
    const report = checkRequirements(["twitter"], {
      captionByPlatform: { twitter: "Hi" } as Record<PlatformId, string>,
      media,
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "image_too_many")).toBe(true);
  });

  it("blocks when a required target is missing (Pinterest board)", () => {
    const report = checkRequirements(["pinterest"], {
      captionByPlatform: { pinterest: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: { pinterest: {} },
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "missing_target_pinterest_board_id")).toBe(true);
  });

  it("passes when the required target is provided", () => {
    const report = checkRequirements(["pinterest"], {
      captionByPlatform: { pinterest: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: { pinterest: { pinterest_board_id: "12345" } },
      composerMediaKind: "image",
    });
    expect(report.overall).toBe("ready");
  });

  it("blocks when 24h hard cap is reached", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
      recent24hCounts: { instagram: 50 },
    });
    expect(report.overall).toBe("blocked");
    expect(report.perPlatform[0].issues.some((i) => i.code === "hard_cap_reached")).toBe(true);
  });

  it("warns when 24h count is between 80% and 100% of cap", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
      recent24hCounts: { instagram: 45 },
    });
    expect(report.overall).toBe("warning");
    expect(report.perPlatform[0].issues.some((i) => i.code === "hard_cap_near")).toBe(true);
  });

  it("aggregates multiple platforms correctly", () => {
    const report = checkRequirements(["instagram", "youtube"], {
      captionByPlatform: { instagram: "Hi", youtube: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(report.blockedCount).toBe(1);
    expect(report.readyCount).toBe(1);
    expect(report.overall).toBe("blocked");
  });

  it("publishablePlatforms returns only the ones not blocked", () => {
    const report = checkRequirements(["instagram", "youtube"], {
      captionByPlatform: { instagram: "Hi", youtube: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: {},
      composerMediaKind: "image",
    });
    expect(publishablePlatforms(report)).toEqual(["instagram"]);
  });

  it("fixable is true when every issue has an actionLabel", () => {
    const report = checkRequirements(["pinterest"], {
      captionByPlatform: { pinterest: "Hi" } as Record<PlatformId, string>,
      media: [{ kind: "image", mimeType: "image/jpeg", sizeBytes: 1_000_000 }],
      advancedByPlatform: { pinterest: {} },
      composerMediaKind: "image",
    });
    expect(report.perPlatform[0].fixable).toBe(true);
  });
});