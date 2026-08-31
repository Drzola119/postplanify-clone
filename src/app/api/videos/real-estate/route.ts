/**
 * POST /api/videos/real-estate
 * Stage 0 (commit) of the Real Estate pipeline — writes a videoJobs doc
 * with the (possibly user-edited) shot plan from the preview step and
 * status "queued". The render worker takes it from there.
 *
 * ai-generated mode: writes shotPlan.shots with status "pending" and
 *   no imageUrl — the render worker runs Stage 1 (image-plan-runner)
 *   first because every later shot's continuity depends on the prior
 *   shots existing. Narration is added per-transition in Stage 2
 *   using the video model's native audio.
 *
 * my-photos mode: writes shotPlan.shots already status "complete" with
 *   imageUrl = the uploaded asset URL — Stage 1 is skipped entirely.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";
import { buildShotPlanFromPhotos } from "@/lib/video-gen/real-estate/shot-plan";
import type { PropertyShotPlan } from "@/lib/video-gen/real-estate/types";
import { createLogger } from "@/lib/log";
import { checkQuota } from "@/lib/billing/quota";

const logger = createLogger("api:videos:real-estate");
const ESTIMATED_VIDEO_COST_USD = 0.5;

// Shot plan posted back from the wizard after preview — only the bits
// the user can edit (room labels, camera direction overrides). The
// shape comes from /preview; we keep the preview's shots list
// structurally identical and re-derive from photos for my-photos.
const commitBodySchema = z.object({
  base: videoGenerateRequestSchema,
  plan: z
    .object({
      shots: z
        .array(
          z.object({
            index: z.number().int().min(0),
            roomLabel: z.string().max(80),
            referenceShotIndexes: z.array(z.number().int().min(0)),
          })
        )
        .optional(),
      transitions: z
        .array(
          z.object({
            index: z.number().int().min(0),
            fromShotIndex: z.number().int().min(0),
            toShotIndex: z.number().int().min(0),
            cameraDirection: z.enum([
              "forward",
              "backward",
              "turn-left",
              "turn-right",
              "tilt-up",
              "tilt-down",
            ]),
            voiceoverLine: z.string().max(200).optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsed = commitBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const body = parsed.data.base;
    if (body.workflow !== "real-estate") {
      return NextResponse.json(
        { error: "This endpoint only accepts the real-estate workflow" },
        { status: 400 }
      );
    }

    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const userSnap = await db.collection("users").doc(user.uid).get();
    const workspaceId: string | undefined = (userSnap.data()?.primaryWorkspaceId ??
      userSnap.data()?.workspaceId) as string | undefined;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }
    const quota = await checkQuota(workspaceId, "video", ESTIMATED_VIDEO_COST_USD);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 402 });
    }

    let plan: PropertyShotPlan;
    if (body.mode === "my-photos") {
      const photoAssetIds = body.photoAssetIds;
      const assetSnaps = await Promise.all(
        photoAssetIds.map((id: string) => db.collection("mediaAssets").doc(id).get())
      );
      const photoAssetUrls: string[] = assetSnaps.map((snap, i) => {
        const url = snap.data()?.url as string | undefined;
        if (!url) {
          throw new Error(`mediaAsset ${photoAssetIds[i]} has no URL`);
        }
        return url;
      });
      plan = buildShotPlanFromPhotos({
        styleId: body.styleId,
        photoAssetIds,
        photoAssetUrls,
        language: body.language,
      });
    } else {
      // ai-generated: the preview endpoint already produced the shot plan;
      // we accept the user's edits (roomLabel / cameraDirection overrides)
      // and persist them. If the wizard didn't post back a plan, the
      // frontend should re-call /preview first.
      if (!parsed.data.plan) {
        return NextResponse.json(
          { error: "ai-generated mode requires a previewed plan in the commit body" },
          { status: 400 }
        );
      }
      const overrides = parsed.data.plan;
      // Build a base plan from request params + user edits. The actual
      // imagePrompts were generated server-side during preview; we
      // regenerate them now from the same skeleton + style so the
      // commit step is reproducible without re-running Groq.
      plan = await buildAiGeneratedPlanFromCommit(body, overrides);
    }

    const jobRef = db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("videoJobs")
      .doc();

    await jobRef.set({
      workspaceId,
      uid: user.uid,
      workflow: "real-estate",
      status: "queued",
      provider: body.provider,
      styleId: body.styleId,
      aspectRatio: body.aspectRatios[0] ?? "16:9",
      shotPlan: plan,
      headline: body.headline,
      price: body.price,
      address: body.address,
      clips: [],
      finalAssets: [],
      totalCostUsd: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Real Estate job queued", {
      jobId: jobRef.id,
      workspaceId,
      uid: user.uid,
      mode: plan.mode,
      shots: plan.shots.length,
    });

    return NextResponse.json(
      { jobId: jobRef.id, status: "queued", shotPlan: plan },
      { status: 202 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Real Estate commit error", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Re-derive the shot plan at commit time from the request + user edits.
 * This avoids the front-end having to round-trip the entire generated
 * plan back to the server (which would need to carry the image prompts
 * the user never sees). The workflow's image-plan-runner doesn't need
 * the prompt text to render — it reads shotPlan.shots[i].imagePrompt
 * from the job doc. So we rebuild prompts here using the same skeleton
 * used by /preview.
 */
import { getPropertyStyle } from "@/lib/video-gen/real-estate/styles";
import { CONTINUITY_FRAGMENTS_FOR_COMMIT } from "@/lib/video-gen/real-estate/shot-plan";
import type { RealEstateAiGeneratedRequest } from "@/lib/validation/video-gen";

async function buildAiGeneratedPlanFromCommit(
  body: RealEstateAiGeneratedRequest,
  overrides: NonNullable<z.infer<typeof commitBodySchema>["plan"]>
): Promise<PropertyShotPlan> {
  const style = getPropertyStyle(body.styleId);
  if (!style) throw new Error(`Unknown property style: ${body.styleId}`);

  const shotCount = body.shotCount ?? 10;
  const NO_TEXT = "No on-image text, no logos, no watermarks, no overlays. Photorealistic architectural photography style.";
  const shots = Array.from({ length: shotCount }, (_, i) => {
    const override = overrides.shots?.find((s) => s.index === i);
    const continuity = CONTINUITY_FRAGMENTS_FOR_COMMIT[i] ?? "";
    const roomLabel = override?.roomLabel ?? `Shot ${i + 1}`;
    const imagePrompt = `${continuity} Style: ${style.descriptors}. ${NO_TEXT}`;
    return {
      index: i,
      roomLabel,
      imagePrompt,
      referenceShotIndexes: override?.referenceShotIndexes ?? [],
      status: "pending" as const,
    };
  });

  const TRANSITION_DIRECTIONS = [
    "forward", "forward", "turn-right", "forward", "forward",
    "backward", "turn-right", "forward", "tilt-up",
  ] as const;

  const transitions = Array.from({ length: Math.max(0, shotCount - 1) }, (_, i) => {
    const override = overrides.transitions?.find((t) => t.index === i);
    return {
      index: i,
      fromShotIndex: i,
      toShotIndex: i + 1,
      cameraDirection: override?.cameraDirection ?? TRANSITION_DIRECTIONS[i] ?? "forward" as const,
      voiceoverLine: override?.voiceoverLine,
      status: "pending" as const,
    };
  });

  return {
    mode: "ai-generated",
    styleId: style.id,
    shots,
    transitions,
    language: body.language,
  };
}
