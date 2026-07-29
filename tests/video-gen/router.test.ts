/**
 * tests/video-gen/router.test.ts
 * Unit tests for the video-gen router — mock provider submit/poll/fetchResult,
 * assert fallback-chain walking and cost aggregation.
 * Mirrors test structure of any existing image-gen router tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VideoGenerateInput } from "@/lib/video-gen/types";

// We mock the providers module so no real HTTP calls are made
vi.mock("@/lib/video-gen/providers", () => ({
  getProviderInstance: vi.fn(),
  getAvailableProviders: vi.fn(() => ["seedance-2-fast", "seedance-2"]),
}));

vi.mock("@/lib/logging", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockInput: VideoGenerateInput = {
  workspaceId: "ws-test",
  provider: "auto",
  mode: "text-to-video",
  prompt: "A cartoon robot baking a cake",
  durationSec: 8,
  aspectRatios: ["16:9"],
  context: {
    workflow: "cartoon",
    styleId: "cartoon-pixar-3d",
    jobGroupId: "job-123",
  },
};

describe("generateVideo router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a successful output from the first provider", async () => {
    const { getProviderInstance } = await import("@/lib/video-gen/providers");
    const mockProvider = {
      id: "seedance-2-fast",
      displayName: "Seedance 2 Fast",
      submit: vi.fn().mockResolvedValue("provider-job-id-123"),
      pollStatus: vi.fn().mockResolvedValue("complete"),
      fetchResult: vi.fn().mockResolvedValue({
        videoUrl: "https://cdn.fal.ai/test.mp4",
        durationSec: 8,
        width: 1280,
        height: 720,
        model: "fal-ai/seedance-2.0-t2v-fast",
      }),
      estimateCostUsd: vi.fn().mockReturnValue(0.04),
    };

    vi.mocked(getProviderInstance).mockReturnValue(mockProvider as ReturnType<typeof getProviderInstance>);

    const { generateVideo } = await import("@/lib/video-gen/router");
    const output = await generateVideo(mockInput);

    expect(output.provider).toBe("seedance-2-fast");
    expect(output.assetUrl).toBe("https://cdn.fal.ai/test.mp4");
    expect(output.durationSec).toBe(8);
    expect(mockProvider.submit).toHaveBeenCalledOnce();
    expect(mockProvider.pollStatus).toHaveBeenCalled();
    expect(mockProvider.fetchResult).toHaveBeenCalledOnce();
  });

  it("falls back to the second provider when the first fails", async () => {
    const { getProviderInstance } = await import("@/lib/video-gen/providers");

    const failingProvider = {
      id: "seedance-2-fast",
      displayName: "Seedance 2 Fast",
      submit: vi.fn().mockRejectedValue(new Error("Rate limit exceeded")),
      pollStatus: vi.fn(),
      fetchResult: vi.fn(),
      estimateCostUsd: vi.fn(),
    };

    const fallbackProvider = {
      id: "veo-3.1-lite",
      displayName: "Veo 3.1 Lite",
      submit: vi.fn().mockResolvedValue("veo-job-id-456"),
      pollStatus: vi.fn().mockResolvedValue("complete"),
      fetchResult: vi.fn().mockResolvedValue({
        videoUrl: "https://storage.googleapis.com/test.mp4",
        durationSec: 8,
        width: 1920,
        height: 1080,
        model: "veo-3.1-lite",
      }),
      estimateCostUsd: vi.fn().mockReturnValue(0.08),
    };

    vi.mocked(getProviderInstance)
      .mockReturnValueOnce(failingProvider as ReturnType<typeof getProviderInstance>)
      .mockReturnValueOnce(fallbackProvider as ReturnType<typeof getProviderInstance>);

    const { generateVideo } = await import("@/lib/video-gen/router");
    const output = await generateVideo(mockInput);

    expect(output.provider).toBe("veo-3.1-lite");
    expect(output.fellBackFrom).toBe("seedance-2-fast");
    expect(fallbackProvider.submit).toHaveBeenCalledOnce();
  });

  it("throws when all providers fail", async () => {
    const { getProviderInstance } = await import("@/lib/video-gen/providers");

    vi.mocked(getProviderInstance).mockReturnValue({
      id: "seedance-2-fast",
      displayName: "Seedance 2 Fast",
      submit: vi.fn().mockRejectedValue(new Error("Provider down")),
      pollStatus: vi.fn(),
      fetchResult: vi.fn(),
      estimateCostUsd: vi.fn(),
    } as ReturnType<typeof getProviderInstance>);

    const { generateVideo } = await import("@/lib/video-gen/router");
    await expect(generateVideo(mockInput)).rejects.toThrow("All video providers failed");
  });
});
