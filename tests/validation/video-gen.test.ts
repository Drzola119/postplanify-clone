/**
 * tests/validation/video-gen.test.ts
 * Validates all hard caps and schema constraints for video generation requests.
 */
import { describe, it, expect } from "vitest";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";

describe("videoGenerateRequestSchema — cartoon workflow", () => {
  const validCartoon = {
    workflow: "cartoon",
    provider: "auto",
    styleId: "cartoon-pixar-3d",
    aspectRatios: ["16:9"],
    subStyle: "pixar-3d",
    durationSec: 8,
    topic: "A robot baking a cake",
  };

  it("accepts a valid cartoon request", () => {
    expect(videoGenerateRequestSchema.safeParse(validCartoon).success).toBe(true);
  });

  it("rejects durationSec > 15", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validCartoon,
      durationSec: 16,
    });
    expect(result.success).toBe(false);
  });

  it("rejects durationSec < 5", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validCartoon,
      durationSec: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 aspect ratios", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validCartoon,
      aspectRatios: ["16:9", "9:16", "1:1", "4:3"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty aspectRatios array", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validCartoon,
      aspectRatios: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown subStyle", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validCartoon,
      subStyle: "watercolour",
    });
    expect(result.success).toBe(false);
  });
});

describe("videoGenerateRequestSchema — real-estate workflow", () => {
  const validRealEstate = {
    workflow: "real-estate",
    provider: "auto",
    styleId: "re-cinematic",
    aspectRatios: ["16:9"],
    headline: "3BR Modern Craftsman",
    photoAssetIds: ["asset-1", "asset-2"],
  };

  it("accepts a valid real-estate request", () => {
    expect(videoGenerateRequestSchema.safeParse(validRealEstate).success).toBe(true);
  });

  it("rejects more than 12 photos", () => {
    const result = videoGenerateRequestSchema.safeParse({
      ...validRealEstate,
      photoAssetIds: Array.from({ length: 13 }, (_, i) => `asset-${i}`),
    });
    expect(result.success).toBe(false);
  });
});
