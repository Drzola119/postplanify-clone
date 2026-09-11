/**
 * /api/carousels/[id]
 *
 * RESTful endpoint for individual Carousel Documents:
 * - GET: Fetch full document with slides, styles, active revision, review status
 * - PUT: Update document / autosave
 * - DELETE: Delete carousel document
 */
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getCarouselDocument, updateCarouselDocument } from "@/lib/carousel-gen/document-service";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { z } from "zod";

const logger = createLogger("api:carousels:id");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing carousel id");

  try {
    const doc = await getCarouselDocument(session.workspaceId, id);
    if (!doc) return jsonError(404, "Carousel not found");

    return jsonOk({ carousel: doc });
  } catch (error) {
    logger.error("Failed to fetch carousel document", { error, id });
    return jsonError(500, "Failed to load carousel");
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing carousel id");

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
      carouselId: id,
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
    logger.error("Failed to update carousel", { error, id });
    return jsonError(500, "Failed to save carousel updates");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await params;
  if (!id) return jsonError(400, "Missing carousel id");

  try {
    const docRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .doc(id);

    const snap = await docRef.get();
    if (!snap.exists) return jsonError(404, "Carousel not found");

    await docRef.delete();
    logger.info("Carousel deleted", { workspaceId: session.workspaceId, id });

    return jsonOk({ success: true });
  } catch (error) {
    logger.error("Failed to delete carousel", { error, id });
    return jsonError(500, "Failed to delete carousel");
  }
}
