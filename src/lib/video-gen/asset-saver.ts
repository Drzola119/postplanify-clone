/**
 * video-gen/asset-saver.ts
 * Persists a generated video to Bunny CDN + creates a mediaAssets Firestore doc.
 * Mirrors src/lib/image-gen/asset-saver.ts — uses the same Bunny CDN helpers
 * and mediaAssets collection, just with mime: "video/mp4".
 */
import "server-only";
import { getAdminFirestore } from "../firebase/admin";
import { uploadToBunny } from "../bunny/upload";
import { createLogger } from "../logging";
import { recordVideoGenUsage } from "./usage";
import type { VideoGenerateOutput, VideoWorkflow } from "./types";

const logger = createLogger("video-gen:asset-saver");

export interface PersistVideoInput {
  workspaceId: string;
  uid: string;
  jobId: string;
  workflow: VideoWorkflow;
  styleId: string;
  output: VideoGenerateOutput;
  /** Raw MP4 buffer or readable stream — result from the provider */
  videoBuffer: Buffer;
  tags?: string[];
}

export interface PersistVideoResult {
  assetId: string;
  assetUrl: string;
}

export async function persistGeneratedVideo(
  input: PersistVideoInput
): Promise<PersistVideoResult> {
  const { workspaceId, uid, jobId, workflow, styleId, output, videoBuffer, tags } = input;

  const fileName = `videos/${workspaceId}/${jobId}-${Date.now()}.mp4`;

  logger.info("Uploading generated video to Bunny CDN", {
    workspaceId,
    jobId,
    sizeBytes: videoBuffer.byteLength,
    fileName,
  });

  const cdnUrl = await uploadToBunny({
    buffer: videoBuffer,
    fileName,
    contentType: "video/mp4",
  });

  const db = getAdminFirestore();
  const assetRef = db.collection("mediaAssets").doc();
  const assetId = assetRef.id;

  const assetDoc = {
    id: assetId,
    workspaceId,
    uid,
    type: "video",
    mime: "video/mp4" as const,
    url: cdnUrl,
    duration: output.durationSec,
    width: output.width,
    height: output.height,
    sizeBytes: videoBuffer.byteLength,
    provider: output.provider,
    model: output.model,
    tags: [
      "ai-video",
      workflow,
      styleId,
      ...(tags ?? []),
    ],
    jobId,
    costUsd: output.costUsd,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await assetRef.set(assetDoc);

  logger.info("Video asset persisted", { assetId, cdnUrl, workspaceId });

  // Record usage — non-fatal if it fails
  await recordVideoGenUsage({
    durationSec: output.durationSec,
    costUsd: output.costUsd,
    provider: output.provider,
    workflow,
    workspaceId,
    uid,
    jobId,
    timestamp: new Date(),
  });

  return { assetId, assetUrl: cdnUrl };
}
