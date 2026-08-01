/**
 * POST /api/videos/real-estate/[jobId]/transitions/[index]/regenerate
 * Re-runs a single transition clip without a full re-render.
 *
 * Cheap to add because generateOneTransitionClip is already a standalone
 * function — this route is a thin wrapper that handles auth + state
 * management. Surfaced in the wizard as a "regenerate" button under
 * each transition thumbnail in the review step.
 *
 * If the job was already complete, it drops back to `waiting_compose`
 * so the FFmpeg worker re-concats with the replacement clip. Otherwise
 * the job status is left alone.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { generateOneTransitionClip } from "@/lib/video-gen/workflows/real-estate";
import type { PropertyShotPlan, PropertyTransition } from "@/lib/video-gen/real-estate/types";
import type { VideoJobDoc } from "@/lib/video-gen/types";
import { createLogger } from "@/lib/log";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("api:videos:real-estate:regenerate");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; index: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, index: indexStr } = await params;
    const index = Number.parseInt(indexStr, 10);
    if (!jobId || !Number.isFinite(index) || index < 0) {
      return NextResponse.json({ error: "Invalid jobId or transition index" }, { status: 400 });
    }

    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const userSnap = await db.collection("users").doc(user.uid).get();
    const workspaceId: string | undefined = userSnap.data()?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const jobRef = db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("videoJobs")
      .doc(jobId);
    const snap = await jobRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const job = snap.data() as VideoJobDoc;
    if (job.uid !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (job.workflow !== "real-estate") {
      return NextResponse.json({ error: "Not a real-estate job" }, { status: 400 });
    }
    const plan = job.shotPlan as PropertyShotPlan | undefined;
    if (!plan || !plan.transitions[index]) {
      return NextResponse.json({ error: "Transition not found" }, { status: 404 });
    }

    const transition: PropertyTransition = plan.transitions[index];
    const provider = (job.provider === "auto" ? "seedance-2-fast" : job.provider);
    const aspectRatio = job.aspectRatio ?? "16:9";

    const wasComplete = job.status === "complete" || job.status === "waiting_compose" || job.status === "composing";
    if (wasComplete) {
      // Bounce back to waiting_compose so the FFmpeg worker re-concats.
      await jobRef.update({
        status: "waiting_compose",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info("Regenerating single real-estate transition", {
      jobId,
      index,
      uid: user.uid,
      wasComplete,
    });

    try {
      const output = await generateOneTransitionClip({
        jobRef,
        job,
        plan,
        transition,
        provider,
        aspectRatio,
      });
      return NextResponse.json(
        { ok: true, transitionIndex: index, assetUrl: output.assetUrl, costUsd: output.costUsd },
        { status: 200 }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Single-transition regeneration failed", { jobId, index, error: message });
      // If we had bounced back to waiting_compose, restore the prior complete status
      // so the worker doesn't try to compose an obviously-broken set.
      if (wasComplete) {
        await jobRef.update({
          status: "complete",
          error: `Transition ${index} regeneration failed: ${message}`,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err) {
    logger.error("Regenerate endpoint error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
