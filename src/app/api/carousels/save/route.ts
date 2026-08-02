/**
 * POST /api/carousels/save
 *
 * F4 / F9 — Persist a finished carousel as a first-class record on the
 * workspace. The generation job (`carouselJobs/{jobId}`) tracks the
 * build lifecycle; the `carousels/{carouselId}` collection is the
 * post-generation record that the management hub, the schedule
 * handoff, and the analytics dashboard all read from.
 *
 * Idempotent on `jobId` — re-saving the same job upserts the same
 * carousel document so retries are safe.
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("api:carousels:save");

const saveCarouselSchema = z.object({
  jobId: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  status: z.enum(["scheduled", "draft", "published"]).default("scheduled"),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  /** Rendered media URLs (one per slide) — already in storage. */
  mediaUrls: z.array(z.string().url().max(2048)).min(1).max(15),
  /** Optional per-slide style info so the analytics page can chart by style. */
  styleId: z.string().max(64).optional(),
  slideCount: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, saveCarouselSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const body = parsed.data;

  try {
    // Look up the job doc for the canonical title / cost / style info
    // and to confirm the user owns it.
    const jobRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carouselJobs")
      .doc(body.jobId);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      return jsonError(404, "Job not found");
    }
    const job = jobSnap.data() as { uid?: string; styleId?: string; costUsd?: number; script?: { slideCount?: number } };
    if (job.uid !== session.uid) {
      return jsonError(403, "Forbidden");
    }

    // Find the existing carousel record for this job, or create one.
    // Idempotency matters because the wizard can fire save() multiple
    // times (after schedule, after a re-edit, etc.).
    const carouselsRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels");
    const existing = await carouselsRef.where("jobId", "==", body.jobId).limit(1).get();
    const docRef = existing.empty ? carouselsRef.doc() : existing.docs[0]!.ref;

    const payload: Record<string, unknown> = {
      workspaceId: session.workspaceId,
      uid: session.uid,
      jobId: body.jobId,
      title: body.title,
      status: body.status,
      mediaUrls: body.mediaUrls,
      styleId: body.styleId ?? job.styleId ?? null,
      slideCount: body.slideCount ?? job.script?.slideCount ?? body.mediaUrls.length,
      costUsd: job.costUsd ?? 0,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (body.scheduledAt) payload.scheduledAt = new Date(body.scheduledAt);
    if (body.publishedAt) payload.publishedAt = new Date(body.publishedAt);

    if (existing.empty) {
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await docRef.set(payload, { merge: true });

    logger.info("Carousel saved", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId: docRef.id,
      jobId: body.jobId,
      status: body.status,
    });

    // Backfill carouselId onto the job doc so the polling endpoint can
    // expose it for cross-linking to the management hub.
    await jobRef.update({
      carouselId: docRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return jsonOk({ carouselId: docRef.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel save failed", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      error: message,
    });
    return jsonError(500, message);
  }
}
