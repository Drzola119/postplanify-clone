/**
 * POST /api/videos/real-estate/preview
 * Stage 0 of the Real Estate pipeline — generates the shot plan via Groq
 * and returns it to the wizard for review, with NO state written.
 *
 * ai-generated mode: one Groq call returns the shot plan. No image
 *   generation yet. Narration is added per-transition in step 2.
 * my-photos mode:    no LLM call needed; we just echo back the planned
 *   transition pairs so the wizard can show "Photo 1 → Photo 2 → ...".
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { videoGenerateRequestSchema } from "@/lib/validation/video-gen";
import { resolvers } from "@/lib/security/server-config";
import {
  buildShotPlanFromPhotos,
  generateRealEstateShotPlan,
} from "@/lib/video-gen/real-estate/shot-plan";
import type { PropertyShotPlan } from "@/lib/video-gen/real-estate/types";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:videos:real-estate:preview");

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
    if (parsed.data.workflow !== "real-estate") {
      return NextResponse.json(
        { error: "This endpoint only accepts the real-estate workflow" },
        { status: 400 }
      );
    }
    // After the workflow narrowing, body is either ai-generated or my-photos.
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

    if (body.mode === "ai-generated") {
      const groqApiKey = resolvers.groqApiKey(req.headers);
      if (!groqApiKey) {
        return NextResponse.json(
          { error: "Shot plan generation not configured (Groq key missing)" },
          { status: 503 }
        );
      }
      const { plan } = await generateRealEstateShotPlan(body, groqApiKey);
      logger.info("Real Estate preview generated (ai-generated)", {
        uid: user.uid,
        shots: plan.shots.length,
        transitions: plan.transitions.length,
      });
      return NextResponse.json({ plan }, { status: 200 });
    }

    // my-photos mode: resolve photo asset URLs from mediaAssets so the
    // shot plan has imageUrl filled in (commit step will already see them).
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

    const plan: PropertyShotPlan = buildShotPlanFromPhotos({
      styleId: body.styleId,
      photoAssetIds,
      photoAssetUrls,
      language: body.language,
    });

    logger.info("Real Estate preview generated (my-photos)", {
      uid: user.uid,
      photos: plan.shots.length,
    });

    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Real Estate preview error", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
