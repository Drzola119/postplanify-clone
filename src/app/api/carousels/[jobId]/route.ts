/**
 * /api/carousels/[jobId]
 *
 * Unified endpoint for:
 * 1. Polling active generation jobs (`carouselJobs/{jobId}`)
 * 2. Fetching, updating (autosave), and deleting Carousel documents (`carousels/{id}`)
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { getCarouselDocument, updateCarouselDocument } from "@/lib/carousel-gen/document-service";
import type { CarouselJobDoc } from "@/lib/carousel-gen/types";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { z } from "zod";

const logger = createLogger("api:carousels:jobId");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const session = await requireSession();
    const workspaceId = !(session instanceof Response) ? session.workspaceId : null;

    if (workspaceId) {
      // 1. Check if it's an active Carousel Generation Job
      const jobSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("carouselJobs")
        .doc(jobId)
        .get();

      if (jobSnap.exists) {
        const job = jobSnap.data() as CarouselJobDoc;
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
      }

      // 2. Check if it's a persisted Carousel Document
      const doc = await getCarouselDocument(workspaceId, jobId);
      if (doc) {
        return jsonOk({ carousel: doc });
      }
    }

    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  } catch (err) {
    logger.error("Carousel fetch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateCarouselSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z
    .enum([
      "draft",
      "in_review",
      "approved",
      "changes_requested",
      "scheduled",
      "published",
      "archived",
    ])
    .optional(),
  aspectRatio: z.enum(["1:1", "4:5", "9:16"]).optional(),
  brandKitId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().max(40)).optional(),
  slides: z.array(z.any()).optional(),
  style: z.any().optional(),
  caption: z.string().max(3000).optional(),
  platformOverrides: z.record(z.any()).optional(),
  reviewStatus: z
    .enum(["none", "in_review", "approved", "changes_requested"])
    .optional(),
  createRevision: z.boolean().optional(),
  revisionLabel: z.string().max(100).optional(),
  mediaUrls: z.array(z.string().url().max(2048)).optional(),
  scheduledAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { jobId } = await params;
  if (!jobId) return jsonError(400, "Missing carousel id");

  const parsed = await parseBody(request, updateCarouselSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }

  try {
    const result = await updateCarouselDocument({
      workspaceId: session.workspaceId,
      carouselId: jobId,
      uid: session.uid,
      updates: parsed.data as any,
      createRevision: parsed.data.createRevision,
      revisionLabel: parsed.data.revisionLabel,
    });

    if (!result.success) {
      return jsonError(400, result.error ?? "Failed to update carousel");
    }

    return jsonOk({
      success: true,
      carousel: result.document,
      newRevisionId: result.newRevisionId,
    });
  } catch (error) {
    logger.error("Failed to update carousel", { error, jobId });
    return jsonError(500, "Failed to save carousel updates");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const { jobId } = await params;
  if (!jobId) return jsonError(400, "Missing carousel id");

  try {
    const docRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .doc(jobId);

    const snap = await docRef.get();
    if (!snap.exists) return jsonError(404, "Carousel not found");

    await docRef.delete();
    logger.info("Carousel deleted", { workspaceId: session.workspaceId, jobId });

    return jsonOk({ success: true });
  } catch (error) {
    logger.error("Failed to delete carousel", { error, jobId });
    return jsonError(500, "Failed to delete carousel");
  }
}
