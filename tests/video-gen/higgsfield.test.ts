/**
 * tests/video-gen/higgsfield.test.ts
 * Unit tests for the Higgsfield provider. Mocks global fetch so no
 * real HTTP calls are made. Mirrors the layout of router.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VideoGenerateInput } from "@/lib/video-gen/types";

const ORIGINAL_API_KEY = process.env.HIGGSFIELD_API_KEY;

const mockInput: VideoGenerateInput = {
  workspaceId: "ws-test",
  provider: "higgsfield",
  mode: "image-to-video",
  prompt: "Hand-drawn whiteboard animation, slow camera push-in",
  sourceImageUrl: "https://cdn.example.com/style-key.png",
  durationSec: 5,
  aspectRatios: ["16:9"],
  context: {
    workflow: "whiteboard",
    styleId: "whiteboard-default",
    jobGroupId: "job-hf-1",
  },
};

const mockFetch = vi.fn();

describe("higgsfield provider", () => {
  beforeEach(() => {
    process.env.HIGGSFIELD_API_KEY = "test-id:test-secret";
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    if (ORIGINAL_API_KEY === undefined) {
      delete process.env.HIGGSFIELD_API_KEY;
    } else {
      process.env.HIGGSFIELD_API_KEY = ORIGINAL_API_KEY;
    }
    vi.unstubAllGlobals();
  });

  it("submits with the correct endpoint, body, and auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "req-abc-123" }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    const providerJobId = await higgsfieldProvider.submit(mockInput);

    expect(providerJobId).toBe("req-abc-123");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.higgsfield.ai/higgsfield-ai/dop/turbo");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Key test-id:test-secret");
    expect(headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      image_url: "https://cdn.example.com/style-key.png",
      prompt: mockInput.prompt,
      duration: 5,
      aspect_ratio: "16:9",
    });
  });

  it("throws a clear error when sourceImageUrl is missing (Higgsfield is image-to-video only)", async () => {
    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(
      higgsfieldProvider.submit({ ...mockInput, sourceImageUrl: undefined })
    ).rejects.toThrow(/image-to-video only/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when the submit response is missing request_id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.submit(mockInput)).rejects.toThrow(/missing request_id/);
  });

  it("surfaces the HTTP error body when the submit fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ detail: "not_enough_credits" }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.submit(mockInput)).rejects.toThrow(
      /Higgsfield submit failed 403.*not_enough_credits/
    );
  });

  it("pollStatus returns 'pending' for queued/in_progress", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "in_progress", request_id: "req-1" }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.pollStatus("req-1")).resolves.toBe("pending");
  });

  it("pollStatus returns 'complete' when status is completed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: "completed",
        request_id: "req-1",
        video: { url: "https://cdn.higgsfield.ai/v.mp4" },
      }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.pollStatus("req-1")).resolves.toBe("complete");
  });

  it("pollStatus returns 'failed' for nsfw and failed statuses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "nsfw", request_id: "req-1" }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.pollStatus("req-1")).resolves.toBe("failed");
  });

  it("fetchResult returns the video URL when complete", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: "completed",
        request_id: "req-1",
        video: { url: "https://cdn.higgsfield.ai/v.mp4" },
      }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    const result = await higgsfieldProvider.fetchResult("req-1");
    expect(result.videoUrl).toBe("https://cdn.higgsfield.ai/v.mp4");
    expect(result.model).toBe("higgsfield-ai/dop/turbo");
  });

  it("fetchResult throws when the job is not yet complete", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "in_progress", request_id: "req-1" }),
    });

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.fetchResult("req-1")).rejects.toThrow(
      /not available/
    );
  });

  it("throws when HIGGSFIELD_API_KEY is missing", async () => {
    delete process.env.HIGGSFIELD_API_KEY;

    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    await expect(higgsfieldProvider.submit(mockInput)).rejects.toThrow(
      /HIGGSFIELD_API_KEY is not configured/
    );
  });

  it("estimateCostUsd returns a non-negative number that grows with duration", async () => {
    const { higgsfieldProvider } = await import("@/lib/video-gen/providers/higgsfield");
    const shortCost = higgsfieldProvider.estimateCostUsd(5, "16:9");
    const longCost = higgsfieldProvider.estimateCostUsd(30, "16:9");
    expect(shortCost).toBeGreaterThan(0);
    expect(longCost).toBeGreaterThan(shortCost);
  });
});
