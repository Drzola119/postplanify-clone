/**
 * video-gen/real-estate/image-plan-runner.ts
 * Sequential reference-chained image generation for Real Estate (ai-generated mode).
 *
 * Stage 1 of the Real Estate pipeline. Iterates `shotPlan.shots` in order;
 * each shot's prompt says "using Image N as reference", so shot 3 cannot
 * start until shot 2's image exists. Sequential, not parallel — that's
 * the whole point of reference chaining.
 *
 * Persists each generated image to Bunny CDN + mediaAssets (reuses the
 * image-gen/asset-saver pipeline), writes shot.imageUrl + status: "complete"
 * back onto the job doc, then advances. On failure, retries that one
 * shot up to 3 times before failing the job — don't silently skip,
 * because every later shot's continuity depends on the one before it.
 */

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { generateInfographic } from "@/lib/image-gen/router";
import { persistGeneratedImage } from "@/lib/image-gen/asset-saver";
import { createLogger } from "@/lib/log";
import type { PropertyShot, PropertyShotPlan } from "./types";

const logger = createLogger("video-gen:real-estate:image-runner");

const MAX_IMAGE_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RunImagePlanArgs {
  jobRef: FirebaseFirestore.DocumentReference;
  workspaceId: string;
  uid: string;
  plan: PropertyShotPlan;
}

export interface RunImagePlanResult {
  shotsGenerated: number;
  shotsFailed: number;
  totalCostUsd: number;
}

/**
 * Image-gen provider to use for the reference-chained shots.
 * "gemini-flash-image" = original Nano Banana — confirmed in the spec
 * as the right engine for reference-chained generation. The Lite tier
 * would also work, but Flash is the canonical Nano Banana.
 */
const IMAGE_PROVIDER = "gemini-flash-image" as const;

/**
 * Aspect ratio locked for the entire walkthrough so consecutive shots
 * composite cleanly into a single video.
 */
const WALKTHROUGH_ASPECT = "16:9" as const;

export async function runImagePlan({
  jobRef,
  workspaceId,
  uid,
  plan,
}: RunImagePlanArgs): Promise<RunImagePlanResult> {
  await jobRef.update({
    status: "generating_images",
    updatedAt: FieldValue.serverTimestamp(),
  });

  let shotsGenerated = 0;
  let shotsFailed = 0;
  let totalCostUsd = 0;

  // Iterate sequentially — each shot may reference one or more prior shots.
  const completedUrls: string[] = [];

  for (let i = 0; i < plan.shots.length; i++) {
    const shot = plan.shots[i];
    if (!shot) continue;

    const referenceUrls = shot.referenceShotIndexes
      .map((idx) => completedUrls[idx])
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    await patchShot(jobRef, i, { index: i, status: "generating" });

    const result = await generateOneShot({
      workspaceId,
      uid,
      shot,
      referenceUrls,
      jobId: jobRef.id,
    });

    if (result.ok) {
      completedUrls[i] = result.assetUrl;
      shotsGenerated++;
      totalCostUsd += result.costUsd;
      await patchShot(jobRef, i, {
        index: i,
        status: "complete",
        imageUrl: result.assetUrl,
        assetId: result.assetId,
      });
    } else {
      shotsFailed++;
      await patchShot(jobRef, i, {
        index: i,
        status: "failed",
        errorMessage: result.error,
      });
      // Fail the whole job — continuity depends on this shot existing.
      await jobRef.update({
        status: "failed",
        error: `Shot ${i} (${shot.roomLabel}) failed after ${MAX_IMAGE_RETRIES} retries: ${result.error}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      logger.error("Real Estate image plan aborted", {
        jobId: jobRef.id,
        failedShotIndex: i,
      });
      return { shotsGenerated, shotsFailed, totalCostUsd };
    }
  }

  return { shotsGenerated, shotsFailed, totalCostUsd };
}

interface GenerateOneShotOk {
  ok: true;
  assetUrl: string;
  assetId: string;
  costUsd: number;
}
interface GenerateOneShotErr {
  ok: false;
  error: string;
}

async function generateOneShot(args: {
  workspaceId: string;
  uid: string;
  shot: PropertyShot;
  referenceUrls: string[];
  jobId: string;
}): Promise<GenerateOneShotOk | GenerateOneShotErr> {
  let lastError: string = "unknown error";

  for (let attempt = 1; attempt <= MAX_IMAGE_RETRIES; attempt++) {
    try {
      const out = await generateInfographic({
        workspaceId: args.workspaceId,
        uid: args.uid,
        provider: IMAGE_PROVIDER,
        prompt: args.shot.imagePrompt,
        aspectRatio: WALKTHROUGH_ASPECT,
        referenceImageUrls: args.referenceUrls,
        context: {
          tool: "instant",
          styleId: args.shot.index === 0 ? "real-estate-shot-0" : "real-estate-ref-chain",
        },
      });

      const persisted = await persistGeneratedImage({
        workspaceId: args.workspaceId,
        uid: args.uid,
        bytes: out.imageBytes,
        mime: out.mime,
        width: out.width,
        height: out.height,
        tool: "instant",
        styleId: `real-estate-${args.jobId}`,
      });

      logger.info("Real Estate shot image generated", {
        jobId: args.jobId,
        shotIndex: args.shot.index,
        attempt,
        assetId: persisted.assetId,
        costUsd: out.costUsd,
        refCount: args.referenceUrls.length,
      });

      return {
        ok: true,
        assetUrl: persisted.cdnUrl,
        assetId: persisted.assetId,
        costUsd: out.costUsd,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("Real Estate shot image attempt failed", {
        jobId: args.jobId,
        shotIndex: args.shot.index,
        attempt,
        error: lastError,
      });
      if (attempt < MAX_IMAGE_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4_000);
      }
    }
  }

  return { ok: false, error: lastError };
}

async function patchShot(
  jobRef: FirebaseFirestore.DocumentReference,
  index: number,
  patch: Partial<PropertyShot>
): Promise<void> {
  const snap = await jobRef.get();
  const plan = snap.data()?.shotPlan as PropertyShotPlan | undefined;
  if (!plan) return;
  const nextShots = plan.shots.map((s) => (s.index === index ? { ...s, ...patch } : s));
  await jobRef.update({
    shotPlan: { ...plan, shots: nextShots },
    updatedAt: FieldValue.serverTimestamp(),
  });
}
