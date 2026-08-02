/**
 * GET /api/carousels/[jobId]
 *
 * Polls the status of a Carousel Studio job. Returns the script, the
 * slide records (with per-slide status + assetUrl), and the running
 * cost. Same shape as /api/videos/[jobId] so the wizard's polling logic
 * stays uniform across both studios.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import type { CarouselJobDoc } from "@/lib/carousel-gen/types";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:jobId");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const userSnap = await adminDb.collection("users").doc(user.uid).get();
    const workspaceId = userSnap.data()?.workspaceId as string | undefined;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const jobSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("carouselJobs")
      .doc(jobId)
      .get();

    if (!jobSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const job = jobSnap.data() as CarouselJobDoc;

    if (job.uid !== user.uid) {
      logger.warn("Unauthorized carousel job access", {
        uid: user.uid,
        jobUid: job.uid,
        jobId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      script: job.script,
      styleId: job.styleId,
      slides: job.slides ?? [],
      costUsd: job.costUsd ?? 0,
      hasFailures: job.hasFailures ?? false,
      error: job.error ?? null,
      visionQa: job.visionQa ?? null,
      createdAt: (job as { createdAt?: { toDate?: () => Date } }).createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: (job as { updatedAt?: { toDate?: () => Date } }).updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error("Carousel job fetch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
