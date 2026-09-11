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
  jobId: z.string().max(64).optional(),
  carouselId: z.string().max(64).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum([
    "scheduled",
    "draft",
    "published",
    "in_review",
    "approved",
    "changes_requested",
    "archived",
  ]).default("draft"),
  aspectRatio: z.enum(["1:1", "4:5", "9:16"]).optional(),
  brandKitId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().max(40)).optional(),
  slides: z.array(z.any()).optional(),
  style: z.any().optional(),
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
      parsed.error?.issues
    );
  }
  const body = parsed.data;

  try {
    const carouselsRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels");

    // Case 1: Direct Carousel Document Update by carouselId
    if (body.carouselId) {
      const docRef = carouselsRef.doc(body.carouselId);
      const existingSnap = await docRef.get();
      if (!existingSnap.exists) {
        return jsonError(404, "Carousel document not found");
      }

      const existingData = existingSnap.data() as Record<string, any>;
      let nextRevisionCount = (existingData.revisionCount || 1);
      let nextRevisionId = existingData.currentRevisionId || "rev_1";

      if (body.createRevision) {
        nextRevisionCount += 1;
        nextRevisionId = `rev_${nextRevisionCount}`;
      }

      let nextReviewStatus = existingData.reviewStatus || "none";
      let nextApproval = existingData.approval || null;

      // Invalidate approval if material changes happen on an approved carousel
      if (
        existingData.reviewStatus === "approved" &&
        body.createRevision &&
        (body.slides || body.style || body.caption)
      ) {
        nextReviewStatus = "in_review";
        nextApproval = null;
      }

      const updatePayload: Record<string, any> = {
        title: body.title,
        status: body.status,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid,
        currentRevisionId: nextRevisionId,
        revisionCount: nextRevisionCount,
        reviewStatus: nextReviewStatus,
        approval: nextApproval,
      };

      if (body.description !== undefined) updatePayload.description = body.description;
      if (body.aspectRatio) updatePayload.aspectRatio = body.aspectRatio;
      if (body.brandKitId !== undefined) updatePayload.brandKitId = body.brandKitId;
      if (body.campaignId !== undefined) updatePayload.campaignId = body.campaignId;
      if (body.folderId !== undefined) updatePayload.folderId = body.folderId;
      if (body.tags !== undefined) updatePayload.tags = body.tags;
      if (body.slides) {
        updatePayload.slides = body.slides.map((s: any, idx: number) => ({
          ...s,
          id: s.id || `slide_${idx}_${Date.now()}`,
          index: idx,
        }));
        updatePayload.slideCount = body.slides.length;
      }
      if (body.style) updatePayload.style = body.style;
      if (body.caption !== undefined) updatePayload.caption = body.caption;
      if (body.mediaUrls) updatePayload.mediaUrls = body.mediaUrls;
      if (body.scheduledAt) updatePayload.scheduledAt = new Date(body.scheduledAt);
      if (body.publishedAt) updatePayload.publishedAt = new Date(body.publishedAt);
      if (body.postId) updatePayload.postId = body.postId;
      if (body.variantGroupId) updatePayload.variantGroupId = body.variantGroupId;
      if (body.variantLabel) updatePayload.variantLabel = body.variantLabel;

      await docRef.set(updatePayload, { merge: true });

      if (body.createRevision) {
        const revRef = docRef.collection("revisions").doc(nextRevisionId);
        await revRef.set({
          id: nextRevisionId,
          carouselId: body.carouselId,
          revisionNumber: nextRevisionCount,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: { uid: session.uid },
          label: body.revisionLabel || `Revision ${nextRevisionCount}`,
          slides: updatePayload.slides || existingData.slides || [],
          style: updatePayload.style || existingData.style || null,
          aspectRatio: updatePayload.aspectRatio || existingData.aspectRatio || "4:5",
          caption: updatePayload.caption || existingData.caption || "",
          renderedAssetUrls: updatePayload.mediaUrls || existingData.mediaUrls || [],
          reviewStatus: nextReviewStatus,
          approval: nextApproval,
        });
      }

      logger.info("Carousel document updated", {
        workspaceId: session.workspaceId,
        carouselId: body.carouselId,
        revisionId: nextRevisionId,
      });

      return jsonOk({
        success: true,
        carouselId: body.carouselId,
        revisionId: nextRevisionId,
        revisionCount: nextRevisionCount,
      });
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
      const job = jobSnap.data() as { uid?: string; styleId?: string; costUsd?: number; script?: { slideCount?: number; slides?: any[] } };
      if (job.uid !== session.uid) {
        return jsonError(403, "Forbidden");
      }

      const existing = await carouselsRef.where("jobId", "==", body.jobId).limit(1).get();
      const docRef = existing.empty ? carouselsRef.doc() : (existing.docs[0]?.ref ?? carouselsRef.doc());

      const payload: Record<string, unknown> = {
        workspaceId: session.workspaceId,
        uid: session.uid,
        jobId: body.jobId,
        title: body.title,
        status: body.status,
        mediaUrls: body.mediaUrls || [],
        styleId: body.styleId ?? job.styleId ?? null,
        slideCount: body.slideCount ?? job.script?.slideCount ?? body.mediaUrls?.length ?? 5,
        costUsd: job.costUsd ?? 0,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (body.scheduledAt) payload.scheduledAt = new Date(body.scheduledAt);
      if (body.publishedAt) payload.publishedAt = new Date(body.publishedAt);
      if (body.postId) payload.postId = body.postId;
      if (body.variantGroupId) payload.variantGroupId = body.variantGroupId;
      if (body.variantLabel) payload.variantLabel = body.variantLabel;

      if (existing.empty) {
        payload.createdAt = FieldValue.serverTimestamp();
      }

      await docRef.set(payload, { merge: true });

      await jobRef.update({
        carouselId: docRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return jsonOk({
        success: true,
        carouselId: docRef.id,
      });
    }

    // Case 3: Create Brand-New Carousel Document
    const newDocRef = carouselsRef.doc();
    const newCarouselId = newDocRef.id;
    const now = Date.now();

    const createdSlides = body.slides
      ? body.slides.map((s: any, idx: number) => ({
          ...s,
          id: s.id || `slide_${idx}_${now}`,
          index: idx,
        }))
      : [];

    const newDocPayload: Record<string, any> = {
      id: newCarouselId,
      workspaceId: session.workspaceId,
      uid: session.uid,
      createdBy: session.uid,
      updatedBy: session.uid,
      title: body.title,
      description: body.description || "",
      status: body.status || "draft",
      aspectRatio: body.aspectRatio || "4:5",
      brandKitId: body.brandKitId || null,
      campaignId: body.campaignId || null,
      folderId: body.folderId || null,
      tags: body.tags || [],
      slides: createdSlides,
      slideCount: createdSlides.length || body.slideCount || 5,
      style: body.style || null,
      caption: body.caption || "",
      mediaUrls: body.mediaUrls || [],
      currentRevisionId: "rev_1",
      revisionCount: 1,
      reviewStatus: "none",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await newDocRef.set(newDocPayload);

    // Write initial revision
    const initialRevRef = newDocRef.collection("revisions").doc("rev_1");
    await initialRevRef.set({
      id: "rev_1",
      carouselId: newCarouselId,
      revisionNumber: 1,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: { uid: session.uid },
      label: "Initial Draft",
      slides: createdSlides,
      style: body.style || null,
      aspectRatio: body.aspectRatio || "4:5",
      caption: body.caption || "",
      renderedAssetUrls: body.mediaUrls || [],
      reviewStatus: "none",
    });

    return jsonOk({
      success: true,
      carouselId: newCarouselId,
      revisionId: "rev_1",
      revisionCount: 1,
    });
  } catch (error) {
    logger.error("Failed to save carousel", { error });
    return jsonError(500, "Failed to save carousel");
  }
}

