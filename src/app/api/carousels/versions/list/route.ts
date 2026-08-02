/**
 * GET /api/carousels/versions/list?carouselId=...
 *
 * Feature B — return the full revision timeline for a carousel, newest
 * first. Powers the History drawer's vertical timeline.
 */
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type {
  CarouselVersion,
  CarouselVersionEditType,
  CarouselVersionSlide,
} from "@/lib/carousel-gen/analytics-types";

const logger = createLogger("api:carousels:versions:list");

const VALID_EDIT_TYPES: readonly CarouselVersionEditType[] = [
  "initial-generate",
  "ai-regenerate",
  "translate",
  "manual-edit",
];

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const carouselId = new URL(request.url).searchParams.get("carouselId") ?? "";
  if (!carouselId) return jsonError(400, "carouselId is required");

  try {
    // Confirm parent access.
    const carouselRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .doc(carouselId);
    const carouselSnap = await carouselRef.get();
    if (!carouselSnap.exists) return jsonError(404, "Carousel not found");

    const snap = await carouselRef
      .collection("versions")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const items: CarouselVersion[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const editType = VALID_EDIT_TYPES.includes(
        data.editType as CarouselVersionEditType
      )
        ? (data.editType as CarouselVersionEditType)
        : "manual-edit";
      const slides = Array.isArray(data.slides)
        ? (data.slides as unknown[]).map((raw, i) => {
            const s = (raw ?? {}) as Record<string, unknown>;
            const slide: CarouselVersionSlide = {
              slideIndex:
                typeof s.slideIndex === "number" ? s.slideIndex : i,
              text: typeof s.text === "string" ? s.text : "",
            };
            if (typeof s.backgroundImageUrl === "string") {
              slide.backgroundImageUrl = s.backgroundImageUrl;
            }
            return slide;
          })
        : [];
      const v: CarouselVersion = {
        versionId: d.id,
        createdAt: toMillis(data.createdAt) || Date.now(),
        editType,
        slideCount:
          typeof data.slideCount === "number" ? data.slideCount : slides.length,
        slides,
      };
      if (typeof data.editedBySlideIndex === "number") {
        v.editedBySlideIndex = data.editedBySlideIndex;
      }
      if (typeof data.label === "string") v.label = data.label;
      return v;
    });

    return jsonOk({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("List versions failed", {
      workspaceId: session.workspaceId,
      carouselId,
      error: message,
    });
    return jsonError(500, message);
  }
}
