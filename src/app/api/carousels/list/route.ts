/**
 * GET /api/carousels/list
 *
 * F9 — Carousel Studio management hub data layer. Returns the current
 * workspace's saved carousel records (post-generation, post-save),
 * newest first. Powers the cards on /dashboard/carousels and the
 * "Carousels" section of /dashboard/analytics.
 */
import "server-only";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:list");

export interface CarouselRecord {
  id: string;
  jobId: string;
  title: string;
  status: "scheduled" | "draft" | "published";
  mediaUrls: string[];
  styleId: string | null;
  slideCount: number;
  costUsd: number;
  scheduledAt: number | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  // Firestore Timestamp has toMillis() — cast for the SDK shape.
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  try {
    const snap = await adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const items: CarouselRecord[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        jobId: typeof data.jobId === "string" ? data.jobId : "",
        title: typeof data.title === "string" ? data.title : "Untitled carousel",
        status:
          (data.status as CarouselRecord["status"]) ?? "draft",
        mediaUrls: Array.isArray(data.mediaUrls)
          ? (data.mediaUrls as unknown[]).filter(
              (u): u is string => typeof u === "string"
            )
          : [],
        styleId: typeof data.styleId === "string" ? data.styleId : null,
        slideCount:
          typeof data.slideCount === "number" ? data.slideCount : 0,
        costUsd: typeof data.costUsd === "number" ? data.costUsd : 0,
        scheduledAt: data.scheduledAt ? toMillis(data.scheduledAt) : null,
        publishedAt: data.publishedAt ? toMillis(data.publishedAt) : null,
        createdAt: toMillis(data.createdAt) || Date.now(),
        updatedAt: toMillis(data.updatedAt) || Date.now(),
      };
    });

    return jsonOk({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("List carousels failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}
