/**
 * /api/carousels/review
 *
 * Review system endpoints:
 * - GET: Fetch public review data for a token
 * - POST: Generate token, add comment, or submit approval/change requests
 */
import "server-only";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { getCarouselDocument, updateCarouselDocument } from "@/lib/carousel-gen/document-service";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { FieldValue } from "firebase-admin/firestore";
import { createLogger } from "@/lib/log";
import { z } from "zod";

const logger = createLogger("api:carousels:review");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return jsonError(400, "Missing review token");
  if (!adminDb) return jsonError(503, "Database not configured");

  try {
    const snaps = await adminDb
      .collectionGroup("carousels")
      .where("activeReviewToken", "==", token)
      .limit(1)
      .get();

    if (snaps.empty) {
      return jsonError(404, "Invalid or expired review link");
    }

    const docSnap = snaps.docs[0];
    const data = docSnap.data();
    const workspaceId = data.workspaceId;
    const carouselId = docSnap.id;

    // Fetch comments for this carousel
    const commentsSnap = await docSnap.ref
      .collection("comments")
      .orderBy("createdAt", "asc")
      .get();

    const comments = commentsSnap.docs.map((c) => ({
      id: c.id,
      ...c.data(),
    }));

    // Fetch active revision details
    let currentRevision = null;
    if (data.currentRevisionId) {
      const revSnap = await docSnap.ref
        .collection("revisions")
        .doc(data.currentRevisionId)
        .get();
      if (revSnap.exists) {
        currentRevision = { id: revSnap.id, ...revSnap.data() };
      }
    }

    return jsonOk({
      carousel: {
        id: carouselId,
        workspaceId,
        title: data.title,
        status: data.status,
        aspectRatio: data.aspectRatio || "4:5",
        slides: data.slides || [],
        style: data.style || null,
        caption: data.caption || "",
        currentRevisionId: data.currentRevisionId,
        reviewStatus: data.reviewStatus || "none",
        approval: data.approval || null,
      },
      currentRevision,
      comments,
    });
  } catch (error) {
    logger.error("Failed to load review link", { error, token });
    return jsonError(500, "Failed to load review data");
  }
}

const reviewActionSchema = z.object({
  action: z.enum(["generate_token", "revoke_token", "add_comment", "resolve_comment", "approve", "request_changes"]),
  carouselId: z.string(),
  workspaceId: z.string().optional(),
  token: z.string().optional(),
  slideId: z.string().nullable().optional(),
  content: z.string().max(2000).optional(),
  commentId: z.string().optional(),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, reviewActionSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, "Invalid payload", parsed.error?.issues);
  }
  const body = parsed.data;
  if (!adminDb) return jsonError(503, "Database not configured");

  // Handle Authenticated Actions (Token generation / Revocation / In-app comments)
  if (body.action === "generate_token" || body.action === "revoke_token") {
    const session = await requireSession();
    if (session instanceof Response) return session;

    const token = body.action === "generate_token"
      ? "rev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      : null;

    await updateCarouselDocument({
      workspaceId: session.workspaceId,
      carouselId: body.carouselId,
      uid: session.uid,
      updates: {
        activeReviewToken: token,
        reviewStatus: token ? "in_review" : "none",
      },
    });

    return jsonOk({
      success: true,
      activeReviewToken: token,
      reviewUrl: token ? `/review/carousel/${token}` : null,
    });
  }

  // Handle Reviewer (Guest or Authenticated) Comments & Approvals via Token
  if (body.token) {
    const snaps = await adminDb
      .collectionGroup("carousels")
      .where("activeReviewToken", "==", body.token)
      .limit(1)
      .get();

    if (snaps.empty) return jsonError(403, "Invalid review token");
    const docSnap = snaps.docs[0];
    const data = docSnap.data();
    const carouselRef = docSnap.ref;

    if (body.action === "add_comment") {
      if (!body.content || body.content.trim().length === 0) {
        return jsonError(400, "Comment content required");
      }
      const commentRef = carouselRef.collection("comments").doc();
      const newComment = {
        id: commentRef.id,
        slideId: body.slideId ?? null,
        revisionId: data.currentRevisionId || "rev_1",
        author: {
          name: body.guestName || "Reviewer",
          email: body.guestEmail,
          isGuest: true,
        },
        content: body.content,
        resolved: false,
        createdAt: FieldValue.serverTimestamp(),
      };
      await commentRef.set(newComment);
      return jsonOk({ success: true, commentId: commentRef.id });
    }

    if (body.action === "resolve_comment" && body.commentId) {
      await carouselRef.collection("comments").doc(body.commentId).update({
        resolved: true,
        resolvedAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ success: true });
    }

    if (body.action === "approve") {
      const approval = {
        approvedBy: body.guestEmail || "Guest Reviewer",
        reviewerName: body.guestName || "Reviewer",
        approvedAt: Date.now(),
        revisionId: data.currentRevisionId || "rev_1",
        notes: body.notes || "",
      };
      await carouselRef.update({
        status: "approved",
        reviewStatus: "approved",
        approval,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ success: true, approval });
    }

    if (body.action === "request_changes") {
      await carouselRef.update({
        status: "changes_requested",
        reviewStatus: "changes_requested",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ success: true, reviewStatus: "changes_requested" });
    }
  }

  return jsonError(400, "Unknown review action");
}
