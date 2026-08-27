import "server-only";
import { getPost, updatePost } from "@/lib/db/posts";
import { getUploadPostStatus, type UploadPostPlatformResult } from "@/lib/uploadpost/publisher";

export interface ReconciledUploadPost {
  final: boolean;
  deliveryConfirmed: boolean;
  status: string;
  results?: Record<string, UploadPostPlatformResult>;
}

/**
 * Refresh one durable post from UploadPost and persist the platform results.
 * Safe to call repeatedly: this only reads the existing UploadPost request and
 * never submits media again.
 */
export async function reconcileUploadPost(input: {
  apiKey: string;
  workspaceId: string;
  postId: string;
}): Promise<ReconciledUploadPost> {
  const post = await getPost(input.workspaceId, input.postId);
  if (!post) throw new Error("Post not found");
  if (!post.uploadPostRequestId && !post.uploadPostJobId) {
    throw new Error("Post has no UploadPost request to reconcile");
  }

  const upstream = await getUploadPostStatus({
    apiKey: input.apiKey,
    requestId: post.uploadPostRequestId,
    jobId: post.uploadPostJobId,
    platforms: post.platforms,
  });
  const results = upstream.results;
  const succeeded = results ? Object.values(results).filter((entry) => entry.ok).length : 0;
  const failed = results ? Object.values(results).filter((entry) => !entry.ok).length : 0;
  const deliveryConfirmed = Boolean(
    upstream.final && results && succeeded === post.platforms.length && failed === 0,
  );

  if (upstream.final && results) {
    const now = new Date();
    const failures = Object.entries(results)
      .filter(([, entry]) => !entry.ok)
      .map(([platform, entry]) => `${platform}: ${entry.error || "failed"}`);
    const patch: Record<string, unknown> = {
      status: deliveryConfirmed ? "published" : succeeded > 0 ? "partially_published" : "failed",
      perPlatformResults: Object.fromEntries(
        Object.entries(results).map(([platform, entry]) => [platform, {
          status: entry.ok ? "delivered" : "failed",
          postId: entry.postId ?? null,
          postUrl: entry.url ?? null,
          deliveredAt: entry.ok ? now.toISOString() : null,
          error: entry.ok ? null : { message: entry.error || "UploadPost delivery failed" },
        }]),
      ),
    };
    if (succeeded > 0) patch.publishedAt = now;
    if (failures.length) patch.failureReason = failures.join("; ");
    if (upstream.requestId) patch.uploadPostRequestId = upstream.requestId;
    if (upstream.jobId) patch.uploadPostJobId = upstream.jobId;
    await updatePost(input.workspaceId, input.postId, patch as never);
  }

  return {
    final: upstream.final && Boolean(results),
    deliveryConfirmed,
    status: upstream.status,
    results,
  };
}
