/**
 * POST /api/videos/whiteboard
 * Generates a whiteboard explainer script via Groq, writes a videoJobs doc,
 * and returns the script preview immediately. Clip generation and composition
 * are handled later by the render worker.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";
import { resolvers } from "@/lib/security/server-config";
import { resolveProvider, resolveClipSpec } from "@/lib/video-gen/whiteboard/clip-matrix";
import { generateWhiteboardScript } from "@/lib/video-gen/whiteboard/script-gen";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:videos:whiteboard");

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsed = videoGenerateRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    if (parsed.data.workflow !== "whiteboard") {
      return NextResponse.json(
        { error: "This endpoint only accepts the whiteboard workflow" },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const userSnap = await db.collection("users").doc(user.uid).get();
    const workspaceId: string | undefined = userSnap.data()?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const groqApiKey = resolvers.groqApiKey(req.headers);
    if (!groqApiKey) {
      return NextResponse.json({ error: "Script generation not configured" }, { status: 503 });
    }

    const provider = resolveProvider(body.provider, body.qualityPreference);
    const clipSpec = resolveClipSpec(provider, body.durationSec);
    const script = await generateWhiteboardScript(body, clipSpec, groqApiKey);

    const jobRef = db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("videoJobs")
      .doc();

    await jobRef.set({
      workspaceId,
      uid: user.uid,
      workflow: "whiteboard",
      status: "queued",
      provider,
      styleId: body.styleId,
      aspectRatio: body.aspectRatio,
      durationSec: body.durationSec,
      script,
      clips: [],
      finalAssets: [],
      totalCostUsd: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Whiteboard job queued", {
      jobId: jobRef.id,
      workspaceId,
      uid: user.uid,
      provider,
      clipCount: clipSpec.clipCount,
    });

    return NextResponse.json(
      { jobId: jobRef.id, status: "queued", script, clipSpec },
      { status: 202 }
    );
  } catch (err) {
    logger.error("Error creating whiteboard job", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
