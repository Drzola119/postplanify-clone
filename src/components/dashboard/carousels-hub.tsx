"use client";

/**
 * Carousels hub client view (F5 + F9).
 *
 * Two CTAs at the top (New Carousel, Browse Templates) and a grid of
 * the workspace's saved carousels. Each card shows the first slide's
 * thumbnail, the title, slide count, cost, and a status badge.
 *
 * The component is fed its data from a server component (so the
 * page hydrates with content already painted); the only state here
 * is for a small "Delete" affordance that the user can use to remove
 * a deck they no longer want.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus, Library, Calendar, Sparkles, Trash2, BarChart3, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast";

export interface HubCarouselItem {
  id: string;
  jobId: string;
  title: string;
  status: "scheduled" | "draft" | "published";
  mediaUrls: string[];
  slideCount: number;
  costUsd: number;
  createdAt: number;
  scheduledAt: number | null;
}

export function CarouselsHub({ items }: { items: HubCarouselItem[] }) {
  const [list, setList] = useState(items);
  const [deleting, setDeleting] = useState<string | null>(null);

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

      {/* List */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <p className="text-sm font-semibold text-zinc-900">
            Your carousels
            <span className="ms-2 text-xs font-normal text-zinc-500">
              {list.length} {list.length === 1 ? "deck" : "decks"}
            </span>
          </p>
        </div>
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <li
                key={c.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-100">
                  {c.mediaUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.mediaUrls[0]}
                      alt={c.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-zinc-400">
                      <Sparkles className="size-6" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">{c.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {c.slideCount} slides · ${c.costUsd.toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={c.status} scheduledAt={c.scheduledAt} />
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      aria-label="Delete carousel"
                    >
                      {deleting === c.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
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
  status: HubCarouselItem["status"];
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
