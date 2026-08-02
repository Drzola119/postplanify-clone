/**
 * POST /api/carousels
 *
 * Stage 1 of the Carousel Studio pipeline — commits a previewed (and
 * possibly edited) script and triggers generation of all 5 slides via
 * the reference-chained workflow (spec §4). Writes a carouselJobs doc
 * with status "scripting", kicks off generation in the background, and
 * returns the job id so the wizard can poll /api/carousels/[jobId].
 */
import "server-only";
import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { getCarouselStyle } from "@/lib/carousel-gen/styles";
import { runCarouselWorkflow } from "@/lib/carousel-gen/workflow";
import { validatePaletteContrast } from "@/lib/carousel-gen/palette-contrast";
import type { CarouselJobDoc, CarouselJobSlideRecord, CarouselStyle } from "@/lib/carousel-gen/types";
import { carouselGenerateRequestSchema } from "@/lib/validation/carousel-gen";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels");

export async function POST(request: NextRequest) {
  // Two auth paths exist in this codebase — try the lighter one first.
  // `tryGetSession` accepts NextRequest for symmetry with future auth
  // checks (cookie read, header inspection), but neither path needs it
  // today — the param is accepted but unused.
  const session = await tryGetSession();
  if (!session) return jsonError(401, "Unauthorized");

  const parsed = await parseBody(request, carouselGenerateRequestSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const body = parsed.data;

  // Resolve the style. M2+ accepts a full snapshot from the client (user-
  // built palette) and prefers it; otherwise falls back to the static
  // registry.
  let resolvedStyle: CarouselStyle;
  if (body.styleSnapshot) {
    const warnings = validatePaletteContrast(body.styleSnapshot);
    if (warnings.length > 0) {
      return jsonError(400, `Palette failed contrast checks: ${warnings.join(" ")}`);
    }
    resolvedStyle = body.styleSnapshot;
  } else {
    try {
      resolvedStyle = getCarouselStyle(body.styleId);
    } catch (err) {
      return jsonError(400, err instanceof Error ? err.message : "Unknown style");
    }
  }

  if (!adminDb) return jsonError(503, "Database not configured");

  const jobRef = adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("carouselJobs")
    .doc();

  const initialSlides: CarouselJobSlideRecord[] = body.slides.map((s) => ({
    index: s.index,
    type: s.type,
    assetUrl: "",
    assetId: "",
    status: "pending",
  }));

  const jobDoc: Omit<CarouselJobDoc, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof FieldValue.serverTimestamp>;
    updatedAt: ReturnType<typeof FieldValue.serverTimestamp>;
  } = {
    workspaceId: session.workspaceId,
    uid: session.uid,
    status: "scripting",
    script: {
      topic: body.topic,
      niche: body.niche,
      tone: body.tone,
      ctaKeyword: body.ctaKeyword,
      outputLanguage: body.outputLanguage ?? "en",
      slides: body.slides.map((s) => ({
        index: s.index,
        type: s.type,
        headline: s.headline,
        body: s.body,
      })),
    },
    styleId: body.styleId,
    styleSnapshot: body.styleSnapshot ?? resolvedStyle,
    slides: initialSlides,
    costUsd: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await jobRef.set(jobDoc);
  logger.info("Carousel job queued", {
    jobId: jobRef.id,
    workspaceId: session.workspaceId,
    uid: session.uid,
    styleId: body.styleId,
    styleSource: resolvedStyle.source,
  });

  // Run the workflow in the background. The wizard polls /api/carousels/[jobId]
  // for live progress. We don't await this — the response should return
  // immediately with the job id so the client can move into polling mode.
  void runCarouselWorkflow({
    jobRef,
    workspaceId: session.workspaceId,
    uid: session.uid,
    styleId: body.styleId,
    script: jobDoc.script,
    headers: request.headers,
  }).catch((err) => {
    logger.error("Carousel workflow crashed", {
      jobId: jobRef.id,
      error: err instanceof Error ? err.message : String(err),
    });
    void jobRef.update({
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return jsonOk({ jobId: jobRef.id, status: "scripting" }, 202);
}

/**
 * Resolve the current session either via the lightweight session-context
 * helper (used by the infographics routes) or via the firebase-admin
 * getCurrentUser (used by the videos routes). Whichever returns first.
 *
 * Returns null if neither succeeds.
 */
async function tryGetSession(): Promise<{
  uid: string;
  workspaceId: string;
} | null> {
  try {
    const session = await (await import("@/lib/auth/session-context")).requireSession();
    if (!(session instanceof Response)) {
      return { uid: session.uid, workspaceId: session.workspaceId };
    }
  } catch {
    /* fall through to firebase path */
  }
  const user = await getCurrentUser();
  if (!user) return null;
  if (!adminDb) return null;
  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const workspaceId = userSnap.data()?.workspaceId as string | undefined;
  if (!workspaceId) return null;
  return { uid: user.uid, workspaceId };
}
