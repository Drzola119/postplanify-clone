"use client";

/**
 * Carousel Studio — Revision history drawer.
 *
 * Phase 2 Feature B. Mounted on the carousels hub and (optionally) the
 * wizard's step 3 panel. Renders a vertical timeline of the carousel's
 * version subcollection, newest first, with per-row:
 *   - relative timestamp
 *   - edit type badge
 *   - one-line text preview (headline of the first slide)
 *   - "Restore" + "Compare" actions
 *
 * "Compare" toggles a 2-version side-by-side plain text diff inside
 * the same drawer. Plain `===` for unchanged, `+` for added, `-` for
 * removed — no library, just line-by-line.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  History as HistoryIcon,
  RotateCcw,
  GitCompareArrows,
  ChevronLeft,
} from "lucide-react";
import { useDrawer } from "@/components/dashboard/drawer-provider";
import { showToast } from "@/components/ui/toast";
import type {
  CarouselVersion,
  CarouselVersionEditType,
  CarouselVersionSlide,
} from "@/lib/carousel-gen/analytics-types";

const EDIT_TYPE_LABELS: Record<CarouselVersionEditType, string> = {
  "initial-generate": "Initial",
  "ai-regenerate": "AI rewrite",
  translate: "Translated",
  "manual-edit": "Manual edit",
};

const EDIT_TYPE_TONE: Record<
  CarouselVersionEditType,
  { bg: string; text: string }
> = {
  "initial-generate": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "ai-regenerate": { bg: "bg-violet-50", text: "text-violet-700" },
  translate: { bg: "bg-amber-50", text: "text-amber-700" },
  "manual-edit": { bg: "bg-sky-50", text: "text-sky-700" },
};

interface HistoryDrawerProps {
  /** Carousel this drawer is bound to. */
  carouselId: string | null;
  /** Display title (used in the drawer header). */
  carouselTitle?: string;
  /** Notifies the hub that a restore succeeded (so the list can refresh). */
  onRestored?: () => void;
}

export function CarouselHistoryDrawer({
  carouselId,
  carouselTitle,
  onRestored,
}: HistoryDrawerProps) {
  const { active, closeDrawer } = useDrawer();
  const open = active === "history" && Boolean(carouselId);

  const [items, setItems] = useState<CarouselVersion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);
  const [confirmingRestoreId, setConfirmingRestoreId] = useState<string | null>(
    null
  );

  // Fetch timeline when the drawer opens.
  useEffect(() => {
    if (!open || !carouselId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/carousels/versions/list?carouselId=${encodeURIComponent(carouselId)}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(data.error?.message ?? "Failed to load history");
        }
        const data = (await res.json()) as { items: CarouselVersion[] };
        if (!cancelled) {
          setItems(data.items);
          // Default compare target = previous version (if any).
          if (data.items.length >= 2) {
            setCompareLeftId(data.items[1]!.versionId);
            setCompareRightId(data.items[0]!.versionId);
          } else if (data.items.length === 1) {
            setCompareLeftId(data.items[0]!.versionId);
            setCompareRightId(data.items[0]!.versionId);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, carouselId]);

  // Reset internal state when the drawer closes.
  useEffect(() => {
    if (!open) {
      setItems(null);
      setError(null);
      setRestoringId(null);
      setConfirmingRestoreId(null);
    }
  }, [open]);

  const handleRestore = useCallback(
    async (versionId: string) => {
      if (!carouselId) return;
      setRestoringId(versionId);
      setConfirmingRestoreId(null);
      try {
        const res = await fetch("/api/carousels/versions/restore", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carouselId, versionId }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(data.error?.message ?? "Restore failed");
        }
        showToast({ tone: "success", title: "Version restored" });
        onRestored?.();
        // Refresh the timeline so the new "Restored from ..." row appears.
        if (open) {
          const refresh = await fetch(
            `/api/carousels/versions/list?carouselId=${encodeURIComponent(carouselId)}`,
            { credentials: "include", cache: "no-store" }
          );
          if (refresh.ok) {
            const data = (await refresh.json()) as { items: CarouselVersion[] };
            setItems(data.items);
          }
        }
      } catch (err) {
        showToast({
          tone: "error",
          title: err instanceof Error ? err.message : "Restore failed",
        });
      } finally {
        setRestoringId(null);
      }
    },
    [carouselId, onRestored, open]
  );

  const compareLeft = useMemo(
    () => items?.find((v) => v.versionId === compareLeftId) ?? null,
    [items, compareLeftId]
  );
  const compareRight = useMemo(
    () => items?.find((v) => v.versionId === compareRightId) ?? null,
    [items, compareRightId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop click to close on mobile + desktop. */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={closeDrawer}
        aria-hidden
      />
      <div
        className="ms-auto relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label="Carousel revision history"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-zinc-500" />
              <p className="truncate text-sm font-semibold text-zinc-900">
                {carouselTitle ?? "Carousel"} — History
              </p>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Every saved script change is recorded here.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close history"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
              <Loader2 className="me-2 size-4 animate-spin" /> Loading history…
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500">
              No versions yet. Generate a carousel to start tracking revisions.
            </div>
          ) : (
            <ol className="relative space-y-4 ps-6">
              <span
                className="absolute start-2.5 top-1 bottom-1 w-px bg-zinc-200"
                aria-hidden
              />
              {items.map((v) => {
                const isLeft = compareLeftId === v.versionId;
                const isRight = compareRightId === v.versionId;
                const confirming = confirmingRestoreId === v.versionId;
                const tone = EDIT_TYPE_TONE[v.editType];
                return (
                  <li key={v.versionId} className="relative">
                    <span
                      className="absolute -start-[18px] top-1.5 size-2.5 rounded-full bg-zinc-300 ring-2 ring-white"
                      aria-hidden
                    />
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tone.bg} ${tone.text}`}
                        >
                          {EDIT_TYPE_LABELS[v.editType]}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {relativeTime(v.createdAt)}
                        </span>
                        {typeof v.editedBySlideIndex === "number" ? (
                          <span className="text-[10px] text-zinc-500">
                            • slide {v.editedBySlideIndex + 1}
                          </span>
                        ) : null}
                      </div>
                      {v.label ? (
                        <p className="mt-1 text-[11px] italic text-zinc-500">
                          {v.label}
                        </p>
                      ) : null}
                      <p className="mt-1.5 line-clamp-2 text-[11px] text-zinc-600">
                        {previewFor(v.slides)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isLeft) setCompareRightId(v.versionId);
                            else setCompareLeftId(v.versionId);
                          }}
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                            isLeft || isRight
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <GitCompareArrows className="size-3" />
                          {isLeft ? "Left" : isRight ? "Right" : "Compare"}
                        </button>
                        {confirming ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleRestore(v.versionId)}
                              disabled={restoringId === v.versionId}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-1.5 py-0.5 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                              {restoringId === v.versionId ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3" />
                              )}
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingRestoreId(null)}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingRestoreId(v.versionId)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            <RotateCcw className="size-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Compare panel */}
        {items && items.length >= 1 && compareLeft && compareRight ? (
          <div className="border-t border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                <GitCompareArrows className="size-3" /> Compare
              </p>
              <p className="text-[10px] text-zinc-500">
                {compareLeft.versionId === compareRight.versionId
                  ? "Pick a second version on the timeline"
                  : "Left → right"}
              </p>
            </div>
            <DiffView
              left={compareLeft}
              right={compareRight}
              isSame={compareLeft.versionId === compareRight.versionId}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
 * Small pieces
 * ============================================================ */

function previewFor(slides: CarouselVersionSlide[]): string {
  if (slides.length === 0) return "(empty)";
  const first = slides[0]?.text ?? "";
  if (slides.length === 1) return first;
  return `${first}  + ${slides.length - 1} more`;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}

/* ============================================================
 * Diff view
 * ============================================================ */

interface DiffViewProps {
  left: CarouselVersion;
  right: CarouselVersion;
  isSame: boolean;
}

function DiffView({ left, right, isSame }: DiffViewProps) {
  const leftLines = useMemo(() => flattenVersion(left), [left]);
  const rightLines = useMemo(() => flattenVersion(right), [right]);
  const max = Math.max(leftLines.length, rightLines.length);

  if (isSame) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 bg-white p-3 text-[11px] text-zinc-500">
        Select a different version on the timeline to see a side-by-side diff.
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white">
      <table className="w-full table-fixed text-[10px]">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500">
            <th className="w-1/2 px-2 py-1 text-start font-medium">
              {left.createdAt ? new Date(left.createdAt).toLocaleString() : "Left"}
            </th>
            <th className="w-1/2 px-2 py-1 text-start font-medium">
              {right.createdAt
                ? new Date(right.createdAt).toLocaleString()
                : "Right"}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: max }).map((_, i) => {
            const l = leftLines[i] ?? "";
            const r = rightLines[i] ?? "";
            const changed = l !== r;
            return (
              <tr
                key={i}
                className={
                  changed
                    ? "bg-amber-50/50 align-top"
                    : "align-top"
                }
              >
                <td
                  className={`whitespace-pre-wrap break-words border-e border-zinc-100 px-2 py-1 font-mono ${
                    changed && l ? "text-red-700" : "text-zinc-700"
                  }`}
                >
                  {l ? (changed ? `- ${l}` : `  ${l}`) : <span className="text-zinc-300">·</span>}
                </td>
                <td
                  className={`whitespace-pre-wrap break-words px-2 py-1 font-mono ${
                    changed && r ? "text-emerald-700" : "text-zinc-700"
                  }`}
                >
                  {r ? (changed ? `+ ${r}` : `  ${r}`) : <span className="text-zinc-300">·</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function flattenVersion(v: CarouselVersion): string[] {
  const lines: string[] = [];
  lines.push(`# ${EDIT_TYPE_LABELS[v.editType]}${v.label ? ` — ${v.label}` : ""}`);
  for (const s of v.slides) {
    lines.push(`Slide ${s.slideIndex + 1}:`);
    lines.push(s.text);
    if (s.backgroundImageUrl) lines.push(`(bg: ${s.backgroundImageUrl})`);
    lines.push("");
  }
  return lines;
}
