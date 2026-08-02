/**
 * /dashboard/carousels
 * Carousel Studio management hub. Single page that shows the
 * workspace's saved carousels + entry points to create a new one or
 * browse the templates library.
 *
 * F5 + F9 — this replaces the original stub. The server component
 * pre-fetches the carousel list so the page hydrates with the cards
 * already painted (no flash of empty state).
 *
 * Phase 2: also passes the perf + A/B variant fields so the hub card
 * can render the perf row, the A/B badge, and the grouped card
 * without a second fetch.
 */
import { Suspense } from "react";
import { Layers, Plus, Library } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { CarouselsHub } from "@/components/dashboard/carousels-hub";
import type {
  CarouselPerformance,
  CarouselRecord,
  CarouselVariantLabel,
} from "@/lib/carousel-gen/analytics-types";
import type { PlatformKey } from "@/types/analytics";

export const metadata = {
  title: "Carousel Studio",
  description:
    "Generate scroll-stopping carousels. Browse your past decks, start a new one, or use a template.",
};

export default async function CarouselsPage() {
  const t = await getTranslations("dashboard.carousels.landing");
  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title={t("page_title")}
        subtitle={t("page_subtitle")}
      />
      <Suspense fallback={<HubSkeleton />}>
        <HubLoader />
      </Suspense>
    </div>
  );
}

async function HubLoader() {
  const session = await requireSession();
  if (session instanceof Response) {
    // No session — fall back to the empty hub so the page still renders
    // (the dashboard layout will have already redirected to login).
    return <CarouselsHub items={[]} />;
  }
  if (!adminDb) return <CarouselsHub items={[]} />;

  const snap = await adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("carousels")
    .orderBy("createdAt", "desc")
    .limit(60)
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
      slideCount: typeof data.slideCount === "number" ? data.slideCount : 0,
      costUsd: typeof data.costUsd === "number" ? data.costUsd : 0,
      createdAt: toMillis(data.createdAt) || Date.now(),
      scheduledAt: data.scheduledAt ? toMillis(data.scheduledAt) : null,
      publishedAt: data.publishedAt ? toMillis(data.publishedAt) : null,
      updatedAt: toMillis(data.updatedAt) || Date.now(),
      postId: typeof data.postId === "string" ? data.postId : null,
      performance: parsePerformance(data.performance),
      variantGroupId:
        typeof data.variantGroupId === "string" ? data.variantGroupId : null,
      variantLabel: parseVariantLabel(data.variantLabel),
      variantWinner:
        typeof data.variantWinner === "boolean" ? data.variantWinner : null,
    };
  });

  return <CarouselsHub items={items} />;
}

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

function parsePerformance(raw: unknown): CarouselPerformance | null {
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

function parseVariantLabel(raw: unknown): CarouselVariantLabel | null {
  return raw === "A" || raw === "B" ? raw : null;
}

function HubSkeleton() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse"
        />
      ))}
    </div>
  );
}

// Make the (currently unused) icons available so the page stays in
// sync with the hub component's import contract.
void Layers;
void Plus;
void Library;
