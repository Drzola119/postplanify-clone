import { describe, it, expect } from "vitest";
import { classifyAspectRatio, formatVideoDuration } from "./video-metadata";
import { checkRequirements } from "@/lib/publishing/requirements";

describe("Video Metadata & Aspect Ratio Detection", () => {
  it("correctly identifies vertical 9:16 aspect ratio", () => {
    const result = classifyAspectRatio(1080, 1920);
    expect(result.aspectRatio).toBe("9:16");
    expect(result.orientation).toBe("vertical");
  });

  it("correctly identifies horizontal 16:9 aspect ratio", () => {
    const result = classifyAspectRatio(1920, 1080);
    expect(result.aspectRatio).toBe("16:9");
    expect(result.orientation).toBe("horizontal");
  });

  it("correctly identifies square 1:1 aspect ratio", () => {
    const result = classifyAspectRatio(1080, 1080);
    expect(result.aspectRatio).toBe("1:1");
    expect(result.orientation).toBe("square");
  });

  it("formats video duration cleanly", () => {
    expect(formatVideoDuration(45)).toBe("0:45");
    expect(formatVideoDuration(125)).toBe("2:05");
    expect(formatVideoDuration(180)).toBe("3:00");
  });
});

describe("Publishing Requirements Aspect Ratio Gatekeeping", () => {
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

  it("allows 9:16 vertical video on Instagram REELS", () => {
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
