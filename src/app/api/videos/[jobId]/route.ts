/**
 * GET /api/videos/[jobId]
 * Polls the status of a video generation job.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:videos:jobId");

export async function GET(
  req: NextRequest,
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

    const jobSnap = await db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("videoJobs")
      .doc(jobId)
      .get();

    if (!jobSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobSnap.data()!;

    if (job.uid !== user.uid) {
      logger.warn("Unauthorized job access attempt", {
        uid: user.uid,
        jobUid: job.uid,
        jobId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      workflow: job.workflow,
      provider: job.provider,
      clips: job.clips ?? [],
      finalAssets: job.finalAssets ?? [],
      script: job.script ?? null,
      shotPlan: job.shotPlan ?? null,
      totalCostUsd: job.totalCostUsd ?? 0,
      error: job.error ?? null,
      createdAt: job.createdAt?.toDate()?.toISOString() ?? null,
      updatedAt: job.updatedAt?.toDate()?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error("Error fetching video job", { error: err });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
