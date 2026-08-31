/**
 * POST /api/videos/generate
 * Validates request, writes a videoJobs Firestore doc, returns 202 + jobId.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";
import { createLogger } from "@/lib/log";
import { FieldValue } from "firebase-admin/firestore";
import { checkQuota } from "@/lib/billing/quota";

const logger = createLogger("api:videos:generate");
const ESTIMATED_VIDEO_COST_USD = 0.5;

export async function POST(req: NextRequest) {
  try {
    // ─ Auth ───────────────────────────────────────────────────────────────────────────
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─ Parse + validate body ───────────────────────────────────────────────────────
    const rawBody = await req.json();
    const parsed = videoGenerateRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // ─ Resolve workspaceId for the authenticated user ──────────────────────────────
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

    // ─ Write videoJob doc (status: queued) ───────────────────────────────────────────
    const jobRef = db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("videoJobs")
      .doc();

    const jobId = jobRef.id;

    await jobRef.set({
      workspaceId,
      uid: user.uid,
      workflow: body.workflow,
      status: "queued",
      provider: body.provider,
      styleId: body.styleId,
      request: body,
      clips: [],
      finalAssets: [],
      totalCostUsd: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Video job queued", {
      jobId,
      workspaceId,
      uid: user.uid,
      workflow: body.workflow,
    });

    return NextResponse.json(
      {
        jobId,
        status: "queued",
        workspaceId,
        workflow: body.workflow,
        message: "Video job queued. Poll GET /api/videos/:jobId for status.",
      },
      { status: 202 }
    );
  } catch (err) {
    logger.error("Error queuing video job", { error: err });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
