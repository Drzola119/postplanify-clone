/**
 * POST /api/videos/whiteboard/preview
 * Generates a whiteboard explainer script via Groq and returns it WITHOUT
 * creating a Firestore job. Used by the wizard's "Generate script" button
 * to show the user the AI-generated phases before they spend credits on
 * the actual render.
 *
 * No state is written. Pure generation + read.
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";
import { resolvers } from "@/lib/security/server-config";
import { resolveProvider, resolveClipSpec } from "@/lib/video-gen/whiteboard/clip-matrix";
import { generateWhiteboardScript } from "@/lib/video-gen/whiteboard/script-gen";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:videos:whiteboard:preview");

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

    if (!adminDb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const userSnap = await adminDb.collection("users").doc(user.uid).get();
    if (!(userSnap.data()?.primaryWorkspaceId ?? userSnap.data()?.workspaceId)) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const groqApiKey = resolvers.groqApiKey(req.headers);
    if (!groqApiKey) {
      return NextResponse.json({ error: "Script generation not configured" }, { status: 503 });
    }

    const provider = resolveProvider(body.provider, body.qualityPreference);
    const clipSpec = resolveClipSpec(provider, body.durationSec);
    const script = await generateWhiteboardScript(body, clipSpec, groqApiKey);

    logger.info("Whiteboard preview generated", {
      uid: user.uid,
      provider,
      clipCount: clipSpec.clipCount,
    });

    return NextResponse.json({ script, clipSpec }, { status: 200 });
  } catch (err) {
    logger.error("Whiteboard preview error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
