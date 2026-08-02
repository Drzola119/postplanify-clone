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
import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type {
  CarouselVersion,
  CarouselVersionEditType,
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

const VALID_EDIT_TYPES: readonly CarouselVersionEditType[] = [
  "initial-generate",
  "ai-regenerate",
  "translate",
  "manual-edit",
];

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, restoreSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
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

    const newVersionId = randomUUID();
    const newVersionRef = carouselRef
      .collection("versions")
      .doc(newVersionId);
    const now = FieldValue.serverTimestamp();
    await newVersionRef.set({
      versionId: newVersionId,
      createdAt: now,
      editType: "manual-edit" as CarouselVersionEditType,
      slideCount,
      slides: sourceSlides,
      label: newLabel,
      // We also keep a back-pointer to the version this restore came
      // from, so the history UI can show "← restored from vN" on the
      // resulting row. Stored as a regular field rather than a true
      // ref so it survives denormalisation snapshots.
      restoredFromVersionId: versionId,
    });

    // Also rewrite the live carousel script fields if they exist on
    // the doc — the wizard reads these when it re-opens the deck. The
    // server doesn't know the full CarouselScript shape, so we only
    // touch the fields we know about.
    const sourceEditType: CarouselVersionEditType = VALID_EDIT_TYPES.includes(
      source.editType as CarouselVersionEditType
    )
      ? (source.editType as CarouselVersionEditType)
      : "manual-edit";
    await carouselRef.set(
      {
        slideCount,
        // Don't overwrite the title; restore is about copy, not naming.
        updatedAt: now,
        lastRestoredFrom: {
          versionId,
          editType: sourceEditType,
          restoredAt: now,
        },
      },
      { merge: true }
    );

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
