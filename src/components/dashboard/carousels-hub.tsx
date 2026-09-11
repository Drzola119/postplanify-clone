"use client";

/**
 * Carousels hub client view.
 *
 * Phase 1: top CTAs + grid of carousel cards with thumbnail, status
 *          badge, delete button.
 * Phase 2:
 *   Feature A — per-card perf row (likes, comments, shares, saves,
 *               engagement rate) and "Sync Stats" button when stale.
 *   Feature B — "🕒 History" button per card that opens the
 *               CarouselHistoryDrawer; restore/compare handled inside.
 *   Feature C — A/B badge on grouped cards, "🧪 Create B Version"
 *               button, "Highest Engagement" sort option, side-by-side
 *               grouped card with 🏆 on the winner.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Library,
  Calendar,
  Sparkles,
  Trash2,
  BarChart3,
  Loader2,
  RefreshCw,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  TrendingUp,
  History as HistoryIcon,
  FlaskConical,
  Trophy,
  ChevronDown,
  Activity,
  Search,
  CheckSquare,
  Square,
  Folder,
  Tag,
  Share2,
  Edit3,
  Copy,
  ExternalLink,
  ShieldCheck,
  Archive,
} from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { useDrawer } from "@/components/dashboard/drawer-provider";
import { CarouselHistoryDrawer } from "@/components/dashboard/carousel-history-drawer";
import {
  PERFORMANCE_STALE_MS,
  type CarouselRecord,
  type CarouselVariantLabel,
} from "@/lib/carousel-gen/analytics-types";

type SortKey = "newest" | "highest-engagement";
type StatusTab = "all" | "draft" | "in_review" | "scheduled" | "published" | "archived";

export function CarouselsHub({ items }: { items: CarouselRecord[] }) {
  const [list, setList] = useState<CarouselRecord[]>(items);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [creatingB, setCreatingB] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerCarousel, setDrawerCarousel] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const { openDrawer } = useDrawer();

  // Search & Status filtering
  const filtered = useMemo(() => {
    return list.filter((item) => {
      // Status tab match
      if (statusTab !== "all") {
        if (statusTab === "in_review" && item.status !== "in_review") return false;
        if (statusTab !== "in_review" && item.status !== statusTab) return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [list, statusTab, searchQuery]);

  const sorted = useMemo(() => {
    if (sort === "highest-engagement") {
      return [...filtered].sort((a, b) => {
        const ar = a.performance?.engagementRate ?? -1;
        const br = b.performance?.engagementRate ?? -1;
        if (ar === br) return b.createdAt - a.createdAt;
        return br - ar;
      });
    }
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [filtered, sort]);

  async function handleDuplicate(id: string) {
    setDuplicating(id);
    try {
      const res = await fetch("/api/carousels/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to duplicate");
      showToast({ tone: "success", title: "Carousel duplicated" });
      if (data.data?.carousel) {
        setList((prev) => [data.data.carousel, ...prev]);
      }
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Failed to duplicate" });
    } finally {
      setDuplicating(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((item) => item.id)));
    }
  }

  async function handleBatchArchive() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Archive ${selectedIds.size} selected carousels?`)) return;

    setList((prev) =>
      prev.map((c) => (selectedIds.has(c.id) ? { ...c, status: "draft" } : c))
    );
    setSelectedIds(new Set());
    showToast({ tone: "success", title: "Carousels archived" });
  }


  // Group records by variantGroupId so A+B render as a single card row.
  const grouped = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<
      | { kind: "single"; item: CarouselRecord }
      | { kind: "group"; groupId: string; a: CarouselRecord; b: CarouselRecord | null }
    > = [];
    for (const item of sorted) {
      if (item.variantGroupId) {
        if (seen.has(item.variantGroupId)) continue;
        seen.add(item.variantGroupId);
        const a = sorted.find(
          (c) => c.variantGroupId === item.variantGroupId && c.variantLabel === "A"
        );
        const b = sorted.find(
          (c) => c.variantGroupId === item.variantGroupId && c.variantLabel === "B"
        );
        if (a && b) {
          result.push({ kind: "group", groupId: item.variantGroupId, a, b });
        } else if (a) {
          result.push({ kind: "single", item: a });
        } else if (b) {
          result.push({ kind: "single", item: b });
        }
      } else {
        result.push({ kind: "single", item });
      }
    }
    return result;
  }, [sorted]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this carousel? This won't remove the assets you've already scheduled.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/carousels/delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Delete failed");
      }
      setList((curr) => curr.filter((c) => c.id !== id));
      showToast({ tone: "success", title: "Carousel removed" });
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setDeleting(null);
    }
  }

  async function handleSyncStats(id: string) {
    setSyncing(id);
    try {
      const res = await fetch("/api/carousels/sync-performance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Sync failed");
      }
      const data = (await res.json()) as
        | { ok: true; performance: NonNullable<CarouselRecord["performance"]> }
        | { ok: false; reason: string; message: string };
      if (data.ok) {
        setList((curr) =>
          curr.map((c) =>
            c.id === id ? { ...c, performance: data.performance } : c
          )
        );
        showToast({ tone: "success", title: "Stats synced" });
      } else {
        showToast({ tone: "error", title: data.message ?? "Sync failed" });
      }
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(null);
    }
  }

  async function handleCreateB(id: string) {
    setCreatingB(id);
    try {
      const res = await fetch("/api/carousels/ab-test/create-variant", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Create B failed");
      }
      const data = (await res.json()) as { variant: CarouselRecord };
      setList((curr) => [...curr, data.variant]);
      showToast({ tone: "success", title: "B variant created" });
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Create B failed" });
    } finally {
      setCreatingB(null);
    }
  }

  function openHistory(item: CarouselRecord) {
    setDrawerCarousel({ id: item.id, title: item.title });
    openDrawer("history");
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Top CTAs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/carousels/new"
          className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm"
        >
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Plus className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">New Carousel</p>
            <p className="text-xs text-zinc-500">Start from a topic and AI generates the deck</p>
          </div>
        </Link>
        <Link
          href="/dashboard/carousels/templates"
          className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm"
        >
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Library className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Browse Templates</p>
            <p className="text-xs text-zinc-500">20+ decks across 8 niches</p>
          </div>
        </Link>
        <Link
          href="/dashboard/carousels/analytics"
          className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm"
        >
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Analytics</p>
            <p className="text-xs text-zinc-500">Track your deck volume, spend, and styles</p>
          </div>
        </Link>
      </div>

      {/* List Header & Controls */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {/* Status Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 bg-zinc-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Decks" },
              { id: "draft", label: "Drafts" },
              { id: "in_review", label: "In Review" },
              { id: "scheduled", label: "Scheduled" },
              { id: "published", label: "Published" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as StatusTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusTab === tab.id
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-amber-500 w-40 sm:w-56"
              />
            </div>

            <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
              <ChevronDown className="size-3" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] font-medium hover:border-zinc-300 focus:outline-none"
                aria-label="Sort carousels"
              >
                <option value="newest">Newest first</option>
                <option value="highest-engagement">Highest engagement</option>
              </select>
            </label>
          </div>
        </div>

        {/* Batch Operations Bar (if items selected) */}
        {selectedIds.size > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold">{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-amber-700 underline text-[11px]"
              >
                {selectedIds.size === sorted.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchArchive}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Selected
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((entry) =>
              entry.kind === "single" ? (
                <CarouselCard
                  key={entry.item.id}
                  item={entry.item}
                  variant="A"
                  isSelected={selectedIds.has(entry.item.id)}
                  onToggleSelect={() => toggleSelect(entry.item.id)}
                  onDelete={handleDelete}
                  deleting={deleting === entry.item.id}
                  onDuplicate={handleDuplicate}
                  duplicating={duplicating === entry.item.id}
                  onSync={handleSyncStats}
                  syncing={syncing === entry.item.id}
                  onHistory={openHistory}
                  onCreateB={handleCreateB}
                  creatingB={creatingB === entry.item.id}
                />
              ) : (
                <GroupedCard
                  key={entry.groupId}
                  groupId={entry.groupId}
                  a={entry.a}
                  b={entry.b!}
                  onDelete={handleDelete}
                  deleting={deleting}
                  onSync={handleSyncStats}
                  syncing={syncing}
                  onHistory={openHistory}
                  onCreateB={handleCreateB}
                  creatingB={creatingB}
                />
              )
            )}
          </ul>
        )}
      </div>

      <CarouselHistoryDrawer
        carouselId={drawerCarousel?.id ?? null}
        carouselTitle={drawerCarousel?.title}
        onRestored={() => {
          // The wizard's local state is the source of truth for live
          // edits, so we just notify the user. The next list refresh
          // will pick up the new "Restored from ..." version row.
        }}
      />
    </div>
  );
}

/* ============================================================
 * Single carousel card
 * ============================================================ */

interface CarouselCardProps {
  item: CarouselRecord;
  variant: CarouselVariantLabel;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDelete: (id: string) => void;
  deleting: boolean;
  onDuplicate?: (id: string) => void;
  duplicating?: boolean;
  onSync: (id: string) => void;
  syncing: boolean;
  onHistory: (item: CarouselRecord) => void;
  onCreateB: (id: string) => void;
  creatingB: boolean;
}

function CarouselCard({
  item,
  variant,
  isSelected,
  onToggleSelect,
  onDelete,
  deleting,
  onDuplicate,
  duplicating,
  onSync,
  syncing,
  onHistory,
  onCreateB,
  creatingB,
}: CarouselCardProps) {
  const isPublished = item.status === "published";
  const isStale =
    isPublished &&
    (!item.performance ||
      Date.now() - (item.performance?.lastSyncedAt ?? 0) > PERFORMANCE_STALE_MS);
  const perf = item.performance;
  const showA = item.variantGroupId !== null && item.variantGroupId !== undefined;

  return (
    <li className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-md flex flex-col justify-between">
      {/* Selection Checkbox */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur transition"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-amber-400" />
          ) : (
            <Square className="w-4 h-4 text-white/80" />
          )}
        </button>
      )}

      {/* Cover Media Preview */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-900 relative">
        {item.mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.mediaUrls[0]}
            alt={item.title}
            className="size-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center text-zinc-500 p-4 text-center">
            <Sparkles className="size-8 text-amber-500/60 mb-2" />
            <p className="text-xs font-semibold text-zinc-300">Editable Slide Deck</p>
            <p className="text-[10px] text-zinc-500">{item.slideCount || 5} structured slides</p>
          </div>
        )}

        {/* Status Badge */}
        <span
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur shadow-sm ${
            item.status === "published"
              ? "bg-emerald-500/90 text-white"
              : item.status === "scheduled"
              ? "bg-blue-500/90 text-white"
              : item.status === "in_review"
              ? "bg-amber-500/90 text-zinc-950"
              : "bg-zinc-800/80 text-zinc-300 border border-zinc-700"
          }`}
        >
          {item.status || "Draft"}
        </span>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="truncate text-sm font-bold text-zinc-900">{item.title}</h4>
            {showA ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                A/B · {variant}
                {item.variantWinner ? <Trophy className="size-2.5" /> : null}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {item.slideCount || 5} slides • Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Primary Action Button: Open in Studio */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <Link
            href={`/dashboard/carousels/${item.id}/edit`}
            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            Open Editor
          </Link>

          {onDuplicate && (
            <button
              type="button"
              title="Duplicate Carousel"
              disabled={duplicating}
              onClick={() => onDuplicate(item.id)}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition"
            >
              {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            title="Delete Carousel"
            disabled={deleting}
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </li>
  );
}


/* ============================================================
 * Grouped A/B card — single grid cell, two mini previews side by side
 * ============================================================ */

interface GroupedCardProps {
  groupId: string;
  a: CarouselRecord;
  b: CarouselRecord;
  onDelete: (id: string) => void;
  deleting: string | null;
  onSync: (id: string) => void;
  syncing: string | null;
  onHistory: (item: CarouselRecord) => void;
  onCreateB: (id: string) => void;
  creatingB: string | null;
}

function GroupedCard({
  groupId,
  a,
  b,
  onDelete,
  deleting,
  onSync,
  syncing,
  onHistory,
  onCreateB,
  creatingB,
}: GroupedCardProps) {
  const winnerA = a.variantWinner === true;
  const winnerB = b.variantWinner === true;

  return (
    <li className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-sm">
      <div className="grid grid-cols-2 gap-px bg-zinc-100">
        <VariantMini item={a} isWinner={winnerA} />
        <VariantMini item={b} isWinner={winnerB} />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {a.title}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
            A/B test
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {a.slideCount} slides · {winnerA || winnerB ? "🏆 Winner declared" : "Tracking"}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <GroupStat
            label="A engagement"
            value={a.performance ? `${a.performance.engagementRate.toFixed(1)}%` : "—"}
            winner={winnerA}
          />
          <GroupStat
            label="B engagement"
            value={b.performance ? `${b.performance.engagementRate.toFixed(1)}%` : "—"}
            winner={winnerB}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-1.5">
          <Link
            href={`/dashboard/carousels/ab-test/${groupId}`}
            className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
          >
            <BarChart3 className="size-3" />
            Compare
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onHistory(a)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            >
              <HistoryIcon className="size-3" />
              History
            </button>
            <button
              type="button"
              onClick={() => onDelete(a.id)}
              disabled={deleting === a.id}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              aria-label="Delete A"
            >
              {deleting === a.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function VariantMini({ item, isWinner }: { item: CarouselRecord; isWinner: boolean }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-white">
      {item.mediaUrls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.mediaUrls[0]}
          alt={`${item.variantLabel} — ${item.title}`}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-zinc-300">
          <Sparkles className="size-4" />
        </div>
      )}
      <span className="absolute start-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {item.variantLabel ?? "?"}
      </span>
      {isWinner ? (
        <span className="absolute end-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
          <Trophy className="size-2.5" /> Winner
        </span>
      ) : null}
    </div>
  );
}

function GroupStat({
  label,
  value,
  winner,
}: {
  label: string;
  value: string;
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-1.5 py-1 text-[10px] ${
        winner
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-700"
      }`}
    >
      <div className="text-[9px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono font-semibold">{value}</div>
    </div>
  );
}

/* ============================================================
 * Small pieces
 * ============================================================ */

function PerfCell({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center" title={label}>
      <Icon className="size-3 text-zinc-500" />
      <span className="mt-0.5 font-mono text-[10px] font-semibold text-zinc-800">
        {typeof value === "number" ? abbreviate(value) : value}
      </span>
    </div>
  );
}

function abbreviate(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
        <Sparkles className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-zinc-900">No carousels yet</p>
      <p className="mt-1 text-xs text-zinc-500">
        Click <span className="font-semibold text-zinc-700">New Carousel</span> to start, or pick a template from the library.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link
          href="/dashboard/carousels/new"
          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 h-9 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <Plus className="size-3.5" /> New Carousel
        </Link>
        <Link
          href="/dashboard/carousels/templates"
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold hover:bg-zinc-50"
        >
          <Library className="size-3.5" /> Templates
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  scheduledAt,
}: {
  status: CarouselRecord["status"];
  scheduledAt: number | null;
}) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        Published
      </span>
    );
  }
  if (status === "scheduled" && scheduledAt) {
    const d = new Date(scheduledAt);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
        <Calendar className="size-2.5" />
        {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
      Draft
    </span>
  );
}

// Suppress unused-import warning for Activity icon while keeping it
// exported in the icon set for future use in this module.
void Activity;
