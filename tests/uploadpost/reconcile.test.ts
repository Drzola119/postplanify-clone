import { beforeEach, describe, expect, it, vi } from "vitest";

const getPostMock = vi.fn();
const updatePostMock = vi.fn();
const getStatusMock = vi.fn();

vi.mock("@/lib/db/posts", () => ({
  getPost: (...args: unknown[]) => getPostMock(...args),
  updatePost: (...args: unknown[]) => updatePostMock(...args),
}));
vi.mock("@/lib/uploadpost/publisher", () => ({
  getUploadPostStatus: (...args: unknown[]) => getStatusMock(...args),
}));

describe("reconcileUploadPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPostMock.mockResolvedValue({
      id: "post-1",
      platforms: ["instagram", "facebook"],
      uploadPostRequestId: "request-1",
    });
  });

  it("persists a truthful partial result with social post URLs", async () => {
    getStatusMock.mockResolvedValue({
      status: "completed",
      final: true,
      requestId: "request-1",
      jobId: "job-1",
      results: {
        instagram: { ok: true, postId: "ig-1", url: "https://instagram.test/p/1" },
        facebook: { ok: false, error: "Invalid media type" },
      },
    });

    const { reconcileUploadPost } = await import("@/lib/uploadpost/reconcile");
    const result = await reconcileUploadPost({ apiKey: "key", workspaceId: "ws-1", postId: "post-1" });

    expect(result.final).toBe(true);
    expect(result.deliveryConfirmed).toBe(false);
    expect(updatePostMock).toHaveBeenCalledWith("ws-1", "post-1", expect.objectContaining({
      status: "partially_published",
      failureReason: "facebook: Invalid media type",
      perPlatformResults: expect.objectContaining({
        instagram: expect.objectContaining({ postUrl: "https://instagram.test/p/1", status: "delivered" }),
        facebook: expect.objectContaining({ status: "failed" }),
      }),
    }));
  });

  it("does not mutate the post while UploadPost is still processing", async () => {
    getStatusMock.mockResolvedValue({ status: "processing", final: false });
    const { reconcileUploadPost } = await import("@/lib/uploadpost/reconcile");
    const result = await reconcileUploadPost({ apiKey: "key", workspaceId: "ws-1", postId: "post-1" });
    expect(result.final).toBe(false);
    expect(updatePostMock).not.toHaveBeenCalled();
  });
});
