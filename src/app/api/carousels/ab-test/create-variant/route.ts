/**
 * POST /api/carousels/ab-test/create-variant
 *
 * Feature C — duplicate a carousel into a B variant for A/B testing.
 *
 * Behaviour:
 *   1. Look up the source carousel.
 *   2. If it already has a `variantGroupId`, reuse it (the new doc
 *      gets `variantLabel: "B"` and the source keeps its existing
 *      label — which is always "A" because the group id was set when
 *      the first B was created).
 *   3. Otherwise generate a fresh UUID, set it on BOTH the source and
 *      the new doc. Source becomes "A", the duplicate is "B".
 *   4. Copy `mediaUrls`, `slideCount`, `styleId` and the per-slide
 *      layout (the rendered images themselves). The new doc starts
 *      out as a "draft" so the user can re-edit it before re-rendering.
 *      `performance` and `postId` are NOT copied — B is a fresh start.
 *
 * Returns: { variantGroupId, variant: CarouselRecord } where `variant`
 * is the freshly-created B doc.
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
  CarouselRecord,
  CarouselVariantLabel,
} from "@/lib/carousel-gen/analytics-types";

const logger = createLogger("api:carousels:ab-test:create-variant");

const createSchema = z.object({
  carouselId: z.string().min(1).max(64),
  /** Optional title for the new variant. Defaults to "{source} (B)". */
  title: z.string().min(1).max(200).optional(),
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

  const parsed = await parseBody(request, createSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const { carouselId, title } = parsed.data;

  try {
    const carouselsRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels");
    const sourceRef = carouselsRef.doc(carouselId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return jsonError(404, "Source carousel not found");
    const source = sourceSnap.data() as Record<string, unknown>;

    const sourceLabel = (source.variantLabel as CarouselVariantLabel | null) ?? null;
    const sourceGroup = typeof source.variantGroupId === "string"
      ? source.variantGroupId
      : null;
    const groupId = sourceGroup ?? randomUUID();
    const sourceVariantLabel: CarouselVariantLabel = sourceGroup
      ? sourceLabel ?? "A"
      : "A";

    const newRef = carouselsRef.doc();
    const now = FieldValue.serverTimestamp();
    const mediaUrls = Array.isArray(source.mediaUrls)
      ? (source.mediaUrls as unknown[]).filter(
          (u): u is string => typeof u === "string"
        )
      : [];
    const styleId = typeof source.styleId === "string" ? source.styleId : null;
    const slideCount = typeof source.slideCount === "number"
      ? source.slideCount
      : mediaUrls.length;
    const newTitle = title ?? `${typeof source.title === "string" ? source.title : "Carousel"} (B)`;

    const variantPayload: Record<string, unknown> = {
      workspaceId: session.workspaceId,
      uid: session.uid,
      jobId: typeof source.jobId === "string" ? source.jobId : "",
      title: newTitle,
      status: "draft" as CarouselRecord["status"],
      mediaUrls,
      styleId,
      slideCount,
      costUsd: 0,
      // Copy through the parent carousel id so the variant trace stays
      // linkable from the hub card.
      sourceCarouselId: carouselId,
      variantGroupId: groupId,
      variantLabel: "B" as CarouselVariantLabel,
      variantWinner: null,
      createdAt: now,
      updatedAt: now,
    };
    await newRef.set(variantPayload);

    // Backfill the source if it had no group yet.
    if (!sourceGroup) {
      await sourceRef.set(
        {
          variantGroupId: groupId,
          variantLabel: sourceVariantLabel,
          variantWinner: null,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    logger.info("Carousel B variant created", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      sourceId: carouselId,
      newId: newRef.id,
      groupId,
    });

    const createdAt = Date.now();
    const variant: CarouselRecord = {
      id: newRef.id,
      jobId: typeof source.jobId === "string" ? source.jobId : "",
      title: newTitle,
      status: "draft",
      mediaUrls,
      styleId,
      slideCount,
      costUsd: 0,
      scheduledAt: null,
      publishedAt: null,
      createdAt,
      updatedAt: createdAt,
      postId: null,
      performance: null,
      variantGroupId: groupId,
      variantLabel: "B",
      variantWinner: null,
    };

    return jsonOk({ variantGroupId: groupId, variant });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("ab-test create-variant failed", {
      workspaceId: session.workspaceId,
      carouselId,
      error: message,
    });
    return jsonError(500, message);
  }
}
