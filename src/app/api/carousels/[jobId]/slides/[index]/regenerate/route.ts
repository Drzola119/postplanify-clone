/**
 * POST /api/carousels/[jobId]/slides/[index]/regenerate
 *
 * Re-runs one slide against the same style-lock + reference chain
 * (spec §4). Thin wrapper over `regenerateOneSlide` from the workflow
 * module — same pattern as /api/videos/real-estate/[jobId]/transitions/
 * [index]/regenerate.
 *
 * The wizard surfaces this as a "Regenerate" button under each slide
 * thumbnail in the review step. Text accuracy from any AI image model
 * is good but not perfect, and a garbled headline on one of 5 slides
 * is a real failure mode — this is the escape hatch.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import type { CarouselJobDoc } from "@/lib/carousel-gen/types";
import { regenerateOneSlide } from "@/lib/carousel-gen/workflow";
import { checkQuota, recordUsage } from "@/lib/billing/quota";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:regenerate");

/**
 * Pre-flight cost estimate for a single-slide regenerate. A regenerate
 * is a real billed API call — must be counted against the workspace
 * quota, not silently treated as "just one slide" / free.
 */
const ESTIMATED_REGENERATE_COST_USD = 0.25;

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
    if (!jobId || !Number.isFinite(index) || index < 0 || index > 4) {
      return NextResponse.json(
        { error: "Invalid jobId or slide index (must be 0-4)" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const userSnap = await adminDb.collection("users").doc(user.uid).get();
    const workspaceId = userSnap.data()?.workspaceId as string | undefined;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const jobRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("carouselJobs")
      .doc(jobId);
    const snap = await jobRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const job = snap.data() as CarouselJobDoc;
    if (job.uid !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!job.script?.slides?.[index]) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    logger.info("Regenerating carousel slide", {
      jobId,
      index,
      uid: user.uid,
    });

    // Quota check — a regenerate costs the same as a fresh slide for the
    // purposes of the cap; bounce before doing any work if the workspace
    // has already blown its budget for the month.
    const quota = await checkQuota(
      workspaceId,
      "carousel",
      ESTIMATED_REGENERATE_COST_USD
    );
    if (!quota.allowed) {
      logger.warn("Carousel regenerate rejected by quota", {
        jobId,
        index,
        uid: user.uid,
        reason: quota.reason,
      });
      return NextResponse.json({ error: quota.reason }, { status: 402 });
    }

    try {
      const out = await regenerateOneSlide({
        jobRef,
        workspaceId,
        uid: user.uid,
        styleId: job.styleId,
        script: job.script,
        slideIndex: index,
        headers: req.headers,
      });
      void recordUsage(workspaceId, "carousel", out.costUsd);
      return NextResponse.json(
        { ok: true, slideIndex: index, ...out },
        { status: 200 }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Single-slide regeneration failed", { jobId, index, error: message });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err) {
    logger.error("Regenerate endpoint error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
