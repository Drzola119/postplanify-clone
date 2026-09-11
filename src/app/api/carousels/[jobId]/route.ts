/**
 * /api/carousels/[jobId]
 *
 * Unified endpoint for:
 * 1. Polling active generation jobs (`carouselJobs/{jobId}`)
 * 2. Fetching, updating (autosave), and deleting Carousel documents (`carousels/{id}`)
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import {
  getCarouselDocument,
  updateCarouselDocument,
} from "@/lib/carousel-gen/document-service";
import type { CarouselJobDoc } from "@/lib/carousel-gen/types";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { z } from "zod";
import { editableSchema, documentId } from "@/lib/carousel-gen/document-schema";
import { listBrandKits } from "@/lib/carousel-gen/brand-kits";

const logger = createLogger("api:carousels:jobId");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const session = await requireSession(false);
    if (session instanceof Response) return session;
    const workspaceId = !(session instanceof Response)
      ? session.workspaceId
      : null;

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
          createdAt:
            (job as { createdAt?: { toDate?: () => Date } }).createdAt
              ?.toDate?.()
              ?.toISOString() ?? null,
          updatedAt:
            (job as { updatedAt?: { toDate?: () => Date } }).updatedAt
              ?.toDate?.()
              ?.toISOString() ?? null,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

const updateCarouselSchema = editableSchema.extend({
  expectedRevisionId: documentId,
  revisionLabel: z.string().max(100).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
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
      parsed.error?.issues,
    );
  }

  try {
    const { expectedRevisionId, revisionLabel, ...updates } = parsed.data;
    const existing = await getCarouselDocument(session.workspaceId, jobId);
    if (!existing) return jsonError(404, "Carousel not found");
    const brandChanged =
      updates.brandKitId !== undefined &&
      updates.brandKitId !== existing.brandKitId;
    const brand =
      brandChanged && updates.brandKitId
        ? (await listBrandKits(session.workspaceId)).find(
            (k) => k.id === updates.brandKitId,
          )
        : null;
    if (brandChanged && updates.brandKitId && !brand)
      return jsonError(400, "Brand kit not found");
    const result = await updateCarouselDocument({
      workspaceId: session.workspaceId,
      carouselId: jobId,
      uid: session.uid,
      updates: {
        ...updates,
        ...(brandChanged ? { brandSnapshot: brand } : {}),
      },
      expectedRevisionId,
      revisionLabel,
    });

    if (!result.success) {
      return jsonError(
        result.error === "conflict" ? 409 : 400,
        result.error ?? "Failed to update carousel",
      );
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
  { params }: { params: Promise<{ jobId: string }> },
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

    await docRef.update({ status: "archived" });
    logger.info("Carousel deleted", {
      workspaceId: session.workspaceId,
      jobId,
    });

    return jsonOk({ success: true });
  } catch (error) {
    logger.error("Failed to delete carousel", { error, jobId });
    return jsonError(500, "Failed to delete carousel");
  }
}
