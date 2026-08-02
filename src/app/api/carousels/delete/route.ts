/**
 * POST /api/carousels/delete
 *
 * F9 — Delete a saved carousel record. The user can clean up drafts
 * and old decks from the management hub. Does NOT delete the rendered
 * media files themselves — those live in the workspace's mediaAssets
 * collection and the user might still be using them in other posts.
 * Only the carousel *record* is removed.
 *
 * POST is used (not DELETE) because it carries the id in the body,
 * which is the existing convention for the other admin-ish endpoints
 * (e.g. /api/carousels/save).
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("api:carousels:delete");

const deleteCarouselSchema = z.object({
  carouselId: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, deleteCarouselSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const { carouselId } = parsed.data;

  try {
    const ref = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .doc(carouselId);
    const snap = await ref.get();
    if (!snap.exists) {
      return jsonError(404, "Carousel not found");
    }
    const data = snap.data() as { uid?: string; jobId?: string };
    if (data.uid !== session.uid) {
      return jsonError(403, "Forbidden");
    }

    await ref.delete();

    // Drop the back-reference on the job doc so the polling endpoint
    // doesn't try to cross-link to a deleted carousel.
    if (data.jobId) {
      try {
        await adminDb
          .collection("workspaces")
          .doc(session.workspaceId)
          .collection("carouselJobs")
          .doc(data.jobId)
          .update({
            carouselId: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          });
      } catch {
        /* job may already be gone — best-effort cleanup */
      }
    }

    logger.info("Carousel deleted", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId,
    });

    return jsonOk({ carouselId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel delete failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}
