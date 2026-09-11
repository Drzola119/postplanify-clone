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
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import {
  createCarouselDraft,
  updateCarouselDocument,
  normalizeCarousel,
} from "@/lib/carousel-gen/document-service";
import {
  editableSchema,
  slideSchema,
  styleSchema,
  documentId,
} from "@/lib/carousel-gen/document-schema";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("api:carousels:save");

const saveCarouselSchema = z.object({
  jobId: documentId.optional(),
  carouselId: documentId.optional(),
  expectedRevisionId: documentId.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z
    .enum([
      "scheduled",
      "draft",
      "published",
      "in_review",
      "approved",
      "changes_requested",
      "archived",
    ])
    .default("draft"),
  aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16"]).optional(),
  brandKitId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().max(40)).optional(),
  slides: z.array(slideSchema).optional(),
  style: styleSchema.optional(),
  caption: z.string().max(3000).optional(),
  createRevision: z.boolean().optional(),
  revisionLabel: z.string().max(100).optional(),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  /** Rendered media URLs (one per slide) — already in storage. */
  mediaUrls: z.array(z.string().url().max(2048)).max(25).optional(),
  /** Optional per-slide style info so the analytics page can chart by style. */
  styleId: z.string().max(64).optional(),
  slideCount: z.number().int().min(1).max(30).optional(),
  /** Post back-link (the post that scheduled this carousel, if any). */
  postId: z.string().min(1).max(64).optional(),
  variantGroupId: z.string().min(1).max(64).optional(),
  variantLabel: z.enum(["A", "B"]).optional(),
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
      parsed.error?.issues,
    );
  }
  const body = parsed.data;

  try {
    const carouselsRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels");

    if (body.carouselId) {
      if (!body.expectedRevisionId)
        return jsonError(400, "Expected revision is required");
      const result = await updateCarouselDocument({
        workspaceId: session.workspaceId,
        uid: session.uid,
        carouselId: body.carouselId,
        updates: editableSchema.parse(body),
        expectedRevisionId: body.expectedRevisionId,
      });
      if (!result.success)
        return jsonError(
          result.error === "conflict" ? 409 : 400,
          result.error || "Save failed",
        );
      return jsonOk({ carouselId: body.carouselId, carousel: result.document });
    }

    // Case 2: Save from legacy / background generation Job ID
    if (body.jobId) {
      const jobRef = adminDb
        .collection("workspaces")
        .doc(session.workspaceId)
        .collection("carouselJobs")
        .doc(body.jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) {
        return jsonError(404, "Job not found");
      }
      const job = jobSnap.data() as {
        uid?: string;
        styleId?: string;
        costUsd?: number;
        script?: { slideCount?: number; slides?: unknown[] };
      };
      if (job.uid !== session.uid) {
        return jsonError(403, "Forbidden");
      }

      const docRef = carouselsRef.doc(`job_${body.jobId}`);
      await adminDb.runTransaction(async (tx) => {
        const existing = await tx.get(docRef);
        if (existing.exists) return;
        if (!body.mediaUrls?.length)
          throw Error("Finish rendering every slide before saving");
        const deck = normalizeCarousel(docRef.id, session.workspaceId, {
          title: body.title,
          caption: body.caption || body.title,
          mediaUrls: body.mediaUrls,
          aspectRatio: "3:4",
          slideCount: body.mediaUrls.length,
          createdBy: session.uid,
          updatedBy: session.uid,
        });
        tx.set(docRef, {
          ...deck,
          jobId: body.jobId,
          costUsd: job.costUsd || 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(docRef.collection("revisions").doc("rev_1"), {
          ...deck,
          id: "rev_1",
          carouselId: docRef.id,
          revisionNumber: 1,
          label: "Generated images",
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.update(jobRef, {
          carouselId: docRef.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      return jsonOk({ success: true, carouselId: docRef.id });
    }

    const carousel = await createCarouselDraft({
      workspaceId: session.workspaceId,
      uid: session.uid,
      ...editableSchema.parse(body),
    });
    if (body.caption) {
      const saved = await updateCarouselDocument({
        workspaceId: session.workspaceId,
        uid: session.uid,
        carouselId: carousel.id,
        updates: { caption: body.caption },
      });
      return jsonOk({ carouselId: carousel.id, carousel: saved.document });
    }
    return jsonOk({ carouselId: carousel.id, carousel });
  } catch (error) {
    logger.error("Failed to save carousel", { error });
    return jsonError(500, "Failed to save carousel");
  }
}
