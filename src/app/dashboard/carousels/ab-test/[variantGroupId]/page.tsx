/**
 * /dashboard/carousels/ab-test/[variantGroupId]
 *
 * Feature C — full side-by-side A/B comparison view.
 *
 * Server component fetches the group, computes the winner if both
 * variants have enough data, and hands off to the client view for
 * the bar chart + actions.
 */
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { AbCompareView } from "@/components/dashboard/carousel-ab-compare-view";
import type {
  CarouselRecord,
  CarouselVariantLabel,
} from "@/lib/carousel-gen/analytics-types";
import type { PlatformKey } from "@/types/analytics";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ variantGroupId: string }>;
}

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

export default async function AbComparePage({ params }: PageProps) {
  const { variantGroupId } = await params;
  return (
    <div className="p-6 max-w-5xl">
      <Suspense fallback={<AbSkeleton />}>
        <AbLoader variantGroupId={variantGroupId} />
      </Suspense>
    </div>
  );
}

async function AbLoader({ variantGroupId }: { variantGroupId: string }) {
  const session = await requireSession();
  if (session instanceof Response || !adminDb) {
    return notFound();
  }

  const snap = await adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("carousels")
    .where("variantGroupId", "==", variantGroupId)
    .limit(10)
    .get();

  if (snap.empty) return notFound();
  const items: CarouselRecord[] = snap.docs.map((d) =>
    toRecord(d.id, d.data() as Record<string, unknown>)
  );
  const a = items.find((r) => r.variantLabel === "A") ?? null;
  const b = items.find((r) => r.variantLabel === "B") ?? null;
  if (!a || !b) return notFound();

  return <AbCompareView a={a} b={b} />;
}

function AbSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-64 rounded bg-zinc-100 animate-pulse" />
      <div className="h-32 rounded-2xl bg-zinc-100 animate-pulse" />
      <div className="h-64 rounded-2xl bg-zinc-100 animate-pulse" />
    </div>
  );
}
