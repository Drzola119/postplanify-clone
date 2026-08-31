import "server-only";
import { adminDb, FieldValue } from "@/lib/db";
import { createLogger } from "@/lib/log";
import { createCaptionJob } from "@/lib/db/caption-jobs";
import type { PostDoc } from "@/lib/db/schema";

const log = createLogger("caption-reconcile");

/**
 * Reconciles orphan posts that have `captionGenerationMode: "automatic"` and `captionJobStatus: "pending"`
 * but are missing an active backing document in the `/captionJobs` collection.
 * Ensures bulk-creation atomicity and recovers from partial failures.
 */
export async function reconcileMissingCaptionJobs(limitCount = 50): Promise<{ reconciledCount: number }> {
  if (!adminDb || typeof adminDb.collectionGroup !== "function") return { reconciledCount: 0 };
  let reconciledCount = 0;

  try {
    // Query posts across workspaces using collectionGroup
    const postsSnap = await adminDb
      .collectionGroup("posts")
      .where("captionGenerationMode", "==", "automatic")
      .where("captionJobStatus", "==", "pending")
      .limit(limitCount)
      .get();

    for (const postDocSnap of postsSnap.docs) {
      const post = postDocSnap.data() as PostDoc;
      if (post.deletedAt || (post.status !== "queued" && post.status !== "scheduled")) {
        continue;
      }

      // Extract workspaceId from document path: workspaces/{workspaceId}/posts/{postId}
      const pathSegments = postDocSnap.ref.path.split("/");
      const workspaceId = (post as unknown as { workspaceId?: string }).workspaceId || (pathSegments.length >= 2 ? pathSegments[1] : null);
      if (!workspaceId) continue;

      const postId = postDocSnap.id;

      // Check if a caption job already exists for this post
      const existingJobsSnap = await adminDb
        .collection("captionJobs")
        .where("postId", "==", postId)
        .where("status", "in", ["pending", "ready_to_run", "processing", "retrying", "ready", "completed"])
        .limit(1)
        .get();

      if (!existingJobsSnap.empty) {
        const existingJobId = existingJobsSnap.docs[0].id;
        if (post.captionJobId !== existingJobId) {
          await postDocSnap.ref.update({
            captionJobId: existingJobId,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        continue;
      }

      // If no active caption job exists, create one now
      try {
        const userId = (post as unknown as { userId?: string; authorUid?: string }).userId || (post as unknown as { authorUid?: string }).authorUid || "system_reconciler";
        const jobId = await createCaptionJob({
          workspaceId,
          userId,
          postId,
          scheduledAt: post.scheduledAt || new Date().toISOString(),
          inputSnapshot: {
            platforms: (post.platforms || []).map((p) => ({ id: p, name: p, charLimit: 280 })),
            multiPlatform: !post.sameForAll,
            mediaUrls: post.mediaUrls,
            imageUrl: post.mediaUrls?.[0],
            extra: post.caption,
          },
        });

        await postDocSnap.ref.update({
          captionJobId: jobId,
          captionJobStatus: "pending",
          updatedAt: FieldValue.serverTimestamp(),
        });

        reconciledCount++;
        log.info("Reconciled missing caption job for post", {
          postId,
          workspaceId,
          jobId,
        });
      } catch (createErr) {
        log.warn("Failed to create reconciled caption job", {
          postId,
          workspaceId,
          error: createErr instanceof Error ? createErr.message : String(createErr),
        });
      }
    }
  } catch (err) {
    log.error("Error during caption job reconciliation tick", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { reconciledCount };
}
