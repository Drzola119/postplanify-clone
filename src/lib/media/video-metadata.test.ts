import { describe, it, expect } from "vitest";
import { classifyAspectRatio, formatVideoDuration } from "./video-metadata";
import { checkRequirements } from "@/lib/publishing/requirements";

describe("Video Metadata & Aspect Ratio Detection", () => {
  it("correctly identifies vertical 9:16 aspect ratio", () => {
    const result = classifyAspectRatio(1080, 1920);
    expect(result.aspectRatio).toBe("9:16");
    expect(result.orientation).toBe("vertical");
    expect(result.isLinkedInRatioValid).toBe(true);
    expect(result.isExtremeVertical).toBe(false);
  });

  it("correctly identifies horizontal 16:9 aspect ratio", () => {
    const result = classifyAspectRatio(1920, 1080);
    expect(result.aspectRatio).toBe("16:9");
    expect(result.orientation).toBe("horizontal");
    expect(result.isLinkedInRatioValid).toBe(true);
    expect(result.isExtremeVertical).toBe(false);
  });

  it("correctly identifies square 1:1 aspect ratio", () => {
    const result = classifyAspectRatio(1080, 1080);
    expect(result.aspectRatio).toBe("1:1");
    expect(result.orientation).toBe("square");
    expect(result.isLinkedInRatioValid).toBe(true);
    expect(result.isExtremeVertical).toBe(false);
  });

  it("detects extreme vertical aspect ratio for LinkedIn", () => {
    // 300x1000 is 0.30 ratio (outside 1:2.4 / 0.416)
    const result = classifyAspectRatio(300, 1000);
    expect(result.isLinkedInRatioValid).toBe(false);
    expect(result.isExtremeVertical).toBe(true);
  });

  it("formats video duration cleanly", () => {
    expect(formatVideoDuration(45)).toBe("0:45");
    expect(formatVideoDuration(125)).toBe("2:05");
    expect(formatVideoDuration(180)).toBe("3:00");
  });
});

describe("Publishing Requirements Aspect Ratio & Platform Gatekeeping", () => {
  it("blocks 16:9 video when Instagram is set to REELS", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Test Reels Post" },
      media: [
        {
          kind: "video",
          mimeType: "video/mp4",
          sizeBytes: 1024 * 1024 * 10,
          durationSec: 30,
          width: 1920,
          height: 1080,
          aspectRatio: "16:9",
          orientation: "horizontal",
          metadataLoaded: true,
        },
      ],
      advancedByPlatform: {
        instagram: { instagram_media_type: "REELS" },
      },
    });

    expect(report.overall).toBe("blocked");
    const igIssues = report.perPlatform[0]?.issues;
    const aspectIssue = igIssues?.find((i) => i.code === "aspect_ratio_mismatch");
    expect(aspectIssue).toBeDefined();
    expect(aspectIssue?.actionLabel).toBe("Crop to 9:16");
  });

  it("blocks video exceeding 90s when Facebook is set to REELS with Deselect action", () => {
    const report = checkRequirements(["facebook", "instagram"], {
      captionByPlatform: { facebook: "FB Reel", instagram: "IG Reel" },
      media: [
        {
          kind: "video",
          mimeType: "video/mp4",
          sizeBytes: 1024 * 1024 * 10,
          durationSec: 120, // 2 minutes (exceeds FB 90s, valid for IG 900s)
          width: 1080,
          height: 1920,
          aspectRatio: "9:16",
          orientation: "vertical",
          metadataLoaded: true,
        },
      ],
      advancedByPlatform: {
        facebook: { facebook_media_type: "REELS" },
        instagram: { instagram_media_type: "REELS" },
      },
    });

    const fbReport = report.perPlatform.find((p) => p.platform === "facebook")!;
    expect(fbReport.severity).toBe("blocked");
    const fbDurationIssue = fbReport.issues.find((i) => i.code === "video_bad_duration");
    expect(fbDurationIssue).toBeDefined();
    expect(fbDurationIssue?.actionLabel).toBe("Deselect Facebook");

    const igReport = report.perPlatform.find((p) => p.platform === "instagram")!;
    expect(igReport.severity).toBe("ready");
  });

  it("surfaces YouTube auto-Short notice for vertical video under 3m", () => {
    const report = checkRequirements(["youtube"], {
      captionByPlatform: { youtube: "Shorts or Long Video" },
      media: [
        {
          kind: "video",
          mimeType: "video/mp4",
          sizeBytes: 1024 * 1024 * 5,
          durationSec: 55,
          width: 1080,
          height: 1920,
          aspectRatio: "9:16",
          orientation: "vertical",
          metadataLoaded: true,
        },
      ],
    });

    const ytReport = report.perPlatform.find((p) => p.platform === "youtube")!;
    const ytNotice = ytReport.issues.find((i) => i.code === "youtube_auto_short_notice");
    expect(ytNotice).toBeDefined();
    expect(ytNotice?.severity).toBe("warning");
  });

  it("blocks extreme vertical video on LinkedIn", () => {
    const report = checkRequirements(["linkedin"], {
      captionByPlatform: { linkedin: "Extreme ratio post" },
      media: [
        {
          kind: "video",
          mimeType: "video/mp4",
          sizeBytes: 1024 * 1024 * 5,
          durationSec: 30,
          width: 300,
          height: 1000,
          aspectRatio: "custom",
          aspectRatioValue: 0.3,
          orientation: "vertical",
          metadataLoaded: true,
        },
      ],
    });

    const liReport = report.perPlatform.find((p) => p.platform === "linkedin")!;
    expect(liReport.severity).toBe("blocked");
    const liAspectIssue = liReport.issues.find((i) => i.code === "linkedin_aspect_ratio_out_of_bounds");
    expect(liAspectIssue).toBeDefined();
    expect(liAspectIssue?.actionLabel).toBe("Deselect LinkedIn");
  });

  it("allows 9:16 vertical video on Instagram REELS within limits", () => {
    const report = checkRequirements(["instagram"], {
      captionByPlatform: { instagram: "Test Reels Post" },
      media: [
        {
          kind: "video",
          mimeType: "video/mp4",
          sizeBytes: 1024 * 1024 * 10,
          durationSec: 30,
          width: 1080,
          height: 1920,
          aspectRatio: "9:16",
          orientation: "vertical",
          metadataLoaded: true,
        },
      ],
      advancedByPlatform: {
        instagram: { instagram_media_type: "REELS" },
      },
    });

    expect(report.overall).toBe("ready");
  });
});
