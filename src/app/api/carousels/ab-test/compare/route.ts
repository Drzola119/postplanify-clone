/**
 * GET /api/carousels/ab-test/compare?variantGroupId=...
 *
 * Feature C — fetch both A and B variants for a group, and (if both
 * have impressions > AB_MIN_IMPRESSIONS) write `variantWinner: true`
 * to the doc with the higher engagementRate.
 *
 * The route is idempotent on the winner write — calling it twice in a
 * row is safe. The winner is only declared once both sides have
 * crossed the impression threshold so the user's first few hours of
 * data can't accidentally tip a variant.
 */
import "server-only";
import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import {
  AB_MIN_IMPRESSIONS,
  type CarouselRecord,
  type CarouselVariantLabel,
} from "@/lib/carousel-gen/analytics-types";
import type { PlatformKey } from "@/types/analytics";

const logger = createLogger("api:carousels:ab-test:compare");

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

function parsePerformance(raw: unknown): CarouselRecord["performance"] {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.likes !== "number" || typeof p.impressions !== "number") return null;
  return {
    likes: p.likes,
    comments: typeof p.comments === "number" ? p.comments : 0,
    shares: typeof p.shares === "number" ? p.shares : 0,
    saves: typeof p.saves === "number" ? p.saves : 0,
    impressions: p.impressions,
    engagementRate: typeof p.engagementRate === "number" ? p.engagementRate : 0,
    lastSyncedAt: toMillis(p.lastSyncedAt) || 0,
    platform: typeof p.platform === "string" ? (p.platform as PlatformKey) : null,
  };
}

function toRecord(id: string, data: Record<string, unknown>): CarouselRecord {
  return {
    id,
    jobId: typeof data.jobId === "string" ? data.jobId : "",
    title: typeof data.title === "string" ? data.title : "Untitled carousel",
    status: (data.status as CarouselRecord["status"]) ?? "draft",
    mediaUrls: Array.isArray(data.mediaUrls)
      ? (data.mediaUrls as unknown[]).filter(
          (u): u is string => typeof u === "string"
        )
      : [],
    styleId: typeof data.styleId === "string" ? data.styleId : null,
    slideCount: typeof data.slideCount === "number" ? data.slideCount : 0,
    costUsd: typeof data.costUsd === "number" ? data.costUsd : 0,
    scheduledAt: data.scheduledAt ? toMillis(data.scheduledAt) : null,
    publishedAt: data.publishedAt ? toMillis(data.publishedAt) : null,
    createdAt: toMillis(data.createdAt) || Date.now(),
    updatedAt: toMillis(data.updatedAt) || Date.now(),
    postId: typeof data.postId === "string" ? data.postId : null,
    performance: parsePerformance(data.performance),
    variantGroupId:
      typeof data.variantGroupId === "string" ? data.variantGroupId : null,
    variantLabel:
      data.variantLabel === "A" || data.variantLabel === "B"
        ? (data.variantLabel as CarouselVariantLabel)
        : null,
    variantWinner:
      typeof data.variantWinner === "boolean" ? data.variantWinner : null,
  };
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const variantGroupId = new URL(request.url).searchParams.get("variantGroupId") ?? "";
  if (!variantGroupId) return jsonError(400, "variantGroupId is required");

  try {
    const carouselsRef = adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels");
    const snap = await carouselsRef
      .where("variantGroupId", "==", variantGroupId)
      .limit(10)
      .get();

    if (snap.empty) return jsonError(404, "No variants found for this group");

    const items: CarouselRecord[] = snap.docs.map((d) =>
      toRecord(d.id, d.data() as Record<string, unknown>)
    );

    const a = items.find((r) => r.variantLabel === "A") ?? null;
    const b = items.find((r) => r.variantLabel === "B") ?? null;

    // Compute a winner if both sides have enough data.
    let winnerLabel: CarouselVariantLabel | null = null;
    if (a && b && a.performance && b.performance) {
      const aImp = a.performance.impressions;
      const bImp = b.performance.impressions;
      if (aImp >= AB_MIN_IMPRESSIONS && bImp >= AB_MIN_IMPRESSIONS) {
        const aRate = a.performance.engagementRate;
        const bRate = b.performance.engagementRate;
        if (aRate !== bRate) {
          winnerLabel = aRate > bRate ? "A" : "B";
        } else {
          // Tie at the engagement-rate level — fall back to raw engagement
          // count so the user still gets a clear leader.
          const aEng =
            a.performance.likes +
            a.performance.comments +
            a.performance.shares +
            a.performance.saves;
          const bEng =
            b.performance.likes +
            b.performance.comments +
            b.performance.shares +
            b.performance.saves;
          if (aEng !== bEng) winnerLabel = aEng > bEng ? "A" : "B";
        }
      }
    }

    // Persist the winner flag on both docs (clears any prior winner).
    if (winnerLabel) {
      const batch = adminDb.batch();
      for (const item of items) {
        const ref = carouselsRef.doc(item.id);
        batch.set(
          ref,
          {
            variantWinner: item.variantLabel === winnerLabel,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      for (const item of items) {
        if (item.variantLabel) {
          item.variantWinner = item.variantLabel === winnerLabel;
        }
      }
    }

    logger.info("ab-test compare", {
      workspaceId: session.workspaceId,
      variantGroupId,
      winnerLabel,
      aImpressions: a?.performance?.impressions ?? null,
      bImpressions: b?.performance?.impressions ?? null,
    });

    return jsonOk({
      variantGroupId,
      a,
      b,
      winner: winnerLabel,
      minimumImpressions: AB_MIN_IMPRESSIONS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("ab-test compare failed", {
      workspaceId: session.workspaceId,
      variantGroupId,
      error: message,
    });
    return jsonError(500, message);
  }
}
