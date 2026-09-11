/**
 * POST /api/carousels/versions/restore
 *
 * Feature B — restore a prior revision. We do NOT roll the deck back
 * silently: instead we write a NEW version labelled
 *   "Restored from {originalCreatedAt}" with editType="manual-edit"
 * whose slides are the historical version's slides. The most-recent
 * generation job then renders the restored copy on the next commit.
 *
 * This keeps history append-only (which is the whole point of
 * "revision history") while still giving the user a real "undo".
 */
import "server-only";
import {
  getCarouselDocument,
  updateCarouselDocument,
} from "@/lib/carousel-gen/document-service";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type {
  CarouselVersion,
  CarouselVersionSlide,
} from "@/lib/carousel-gen/analytics-types";

const logger = createLogger("api:carousels:versions:restore");

const restoreSchema = z.object({
  carouselId: z.string().min(1).max(64),
  versionId: z.string().min(1).max(64),
});

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, restoreSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues,
    );
  }
  const { carouselId, versionId } = parsed.data;

  try {
    const carouselRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .doc(carouselId);
    const carouselSnap = await carouselRef.get();
    if (!carouselSnap.exists) return jsonError(404, "Carousel not found");

    const versionRef = carouselRef.collection("versions").doc(versionId);
    const versionSnap = await versionRef.get();
    if (!versionSnap.exists) return jsonError(404, "Version not found");
    const source = versionSnap.data() as Record<string, unknown>;

    const sourceSlides = Array.isArray(source.slides)
      ? (source.slides as unknown[]).map((raw, i) => {
          const s = (raw ?? {}) as Record<string, unknown>;
          const slide: CarouselVersionSlide = {
            slideIndex: typeof s.slideIndex === "number" ? s.slideIndex : i,
            text: typeof s.text === "string" ? s.text : "",
          };
          if (typeof s.backgroundImageUrl === "string") {
            slide.backgroundImageUrl = s.backgroundImageUrl;
          }
          return slide;
        })
      : [];
    const slideCount = sourceSlides.length;
    const sourceCreatedAtMs = toMillis(source.createdAt) || Date.now();
    const sourceLabel =
      typeof source.label === "string" && source.label
        ? source.label
        : new Date(sourceCreatedAtMs).toLocaleString();
    const newLabel = `Restored from ${sourceLabel}`;

    const current = await getCarouselDocument(session.workspaceId, carouselId);
    if (!current) return jsonError(404, "Carousel not found");
    if (!sourceSlides.length)
      return jsonError(422, "This legacy version has no restorable slides");
    const restored = await updateCarouselDocument({
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId,
      expectedRevisionId: current.currentRevisionId,
      createRevision: true,
      revisionLabel: newLabel,
      updates: {
        slides: sourceSlides.map((s, i) => ({
          id: current.slides[i]?.id || `restored_${i}`,
          index: i,
          type: i === 0 ? "hook" : "value",
          headline: s.text,
          backgroundImageUrl: s.backgroundImageUrl,
          backgroundOpacity: 35,
        })),
      },
    });
    if (!restored.success)
      return jsonError(
        409,
        "The deck changed during restore. Reload and try again.",
      );
    const newVersionId = restored.newRevisionId!;
    logger.info("Carousel version restored", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId,
      sourceVersionId: versionId,
      newVersionId,
    });

    const echo: CarouselVersion = {
      versionId: newVersionId,
      createdAt: Date.now(),
      editType: "manual-edit",
      slideCount,
      slides: sourceSlides,
      label: newLabel,
    };
    return jsonOk({ version: echo, sourceVersionId: versionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel version restore failed", {
      workspaceId: session.workspaceId,
      carouselId,
      versionId,
      error: message,
    });
    return jsonError(500, message);
  }
}
