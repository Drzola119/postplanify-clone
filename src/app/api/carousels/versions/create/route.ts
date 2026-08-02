/**
 * POST /api/carousels/versions/create
 *
 * Feature B — append a new revision-history snapshot to a carousel's
 * `versions` subcollection. Called from the wizard on:
 *   - initial-generate (after preview success)
 *   - ai-regenerate (per slide rewrite)
 *   - translate (after the new-language script is applied)
 *   - manual-edit (debounced on blur or step nav)
 *
 * Server is the source of truth for IDs and timestamps; the client
 * never sets them. Each version carries the full slide text + any
 * per-slide background URL so a restore can rehydrate the deck
 * exactly as it was at that moment.
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
import type { CarouselVersion } from "@/lib/carousel-gen/analytics-types";

const logger = createLogger("api:carousels:versions:create");

const createSchema = z.object({
  carouselId: z.string().min(1).max(64),
  editType: z.enum([
    "initial-generate",
    "ai-regenerate",
    "translate",
    "manual-edit",
  ]),
  slideCount: z.number().int().min(1).max(20),
  slides: z
    .array(
      z.object({
        slideIndex: z.number().int().min(0).max(49),
        text: z.string().max(2_000),
        backgroundImageUrl: z.string().url().max(2_048).optional(),
      })
    )
    .min(1)
    .max(20),
  editedBySlideIndex: z.number().int().min(0).max(49).optional(),
  label: z.string().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, createSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const body = parsed.data;

  // Confirm the parent carousel exists in this workspace.
  const carouselRef = adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("carousels")
    .doc(body.carouselId);
  const carouselSnap = await carouselRef.get();
  if (!carouselSnap.exists) {
    return jsonError(404, "Carousel not found");
  }

  try {
    const versionId = randomUUID();
    const now = FieldValue.serverTimestamp();
    const versionRef = carouselRef.collection("versions").doc(versionId);
    const payload: Record<string, unknown> = {
      versionId,
      createdAt: now,
      editType: body.editType,
      slideCount: body.slideCount,
      slides: body.slides,
    };
    if (body.editedBySlideIndex !== undefined) {
      payload.editedBySlideIndex = body.editedBySlideIndex;
    }
    if (body.label) payload.label = body.label;
    await versionRef.set(payload);

    logger.info("Carousel version created", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId: body.carouselId,
      versionId,
      editType: body.editType,
    });

    const echo: CarouselVersion = {
      versionId,
      createdAt: Date.now(),
      editType: body.editType,
      slideCount: body.slideCount,
      slides: body.slides,
      editedBySlideIndex: body.editedBySlideIndex,
      label: body.label,
    };
    return jsonOk({ version: echo });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel version create failed", {
      workspaceId: session.workspaceId,
      carouselId: body.carouselId,
      error: message,
    });
    return jsonError(500, message);
  }
}
