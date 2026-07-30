/**
 * tests/whiteboard/clip-matrix.test.ts
 * Provider resolution and clip-count arithmetic for the whiteboard workflow.
 */
import { describe, it, expect } from "vitest";
import { resolveProvider, resolveClipSpec } from "@/lib/video-gen/whiteboard/clip-matrix";

describe("resolveProvider", () => {
  it("resolves auto + budget to the cheapest provider", () => {
    expect(resolveProvider("auto", "budget")).toBe("seedance-2-fast");
  });

  it("resolves auto + quality to the highest-fidelity provider", () => {
    expect(resolveProvider("auto", "quality")).toBe("veo-3.1");
  });

  it("ignores the quality preference when the provider is explicit", () => {
    expect(resolveProvider("veo-3.1", "budget")).toBe("veo-3.1");
    expect(resolveProvider("seedance-2-fast", "quality")).toBe("seedance-2-fast");
  });
});

describe("resolveClipSpec", () => {
  it("splits 30s into 6x5s clips on seedance-2-fast", () => {
    expect(resolveClipSpec("seedance-2-fast", 30)).toEqual({
      provider: "seedance-2-fast",
      clipDurationSec: 5,
      clipCount: 6,
      actualTotalSec: 30,
    });
  });

  it("splits 60s into 12x5s clips on seedance-2-fast", () => {
    expect(resolveClipSpec("seedance-2-fast", 60)).toEqual({
      provider: "seedance-2-fast",
      clipDurationSec: 5,
      clipCount: 12,
      actualTotalSec: 60,
    });
  });

  it("splits 30s into 3x10s clips on veo-3.1", () => {
    expect(resolveClipSpec("veo-3.1", 30)).toEqual({
      provider: "veo-3.1",
      clipDurationSec: 10,
      clipCount: 3,
      actualTotalSec: 30,
    });
  });

  it("splits 60s into 6x10s clips on veo-3.1", () => {
    expect(resolveClipSpec("veo-3.1", 60)).toEqual({
      provider: "veo-3.1",
      clipDurationSec: 10,
      clipCount: 6,
      actualTotalSec: 60,
    });
  });

  it("rounds up so the rendered video is never shorter than requested", () => {
    const spec = resolveClipSpec("seedance-2", 30);
    expect(spec.clipCount).toBe(4);
    expect(spec.actualTotalSec).toBe(32);
    expect(spec.actualTotalSec).toBeGreaterThanOrEqual(30);
  });

  it("splits 30s into 6x5s clips on higgsfield (image-to-video, 5s max)", () => {
    expect(resolveClipSpec("higgsfield", 30)).toEqual({
      provider: "higgsfield",
      clipDurationSec: 5,
      clipCount: 6,
      actualTotalSec: 30,
    });
  });
});
