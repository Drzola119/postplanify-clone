"use client";

import {
  Undo,
  Redo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Share2,
  Download,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface StudioToolbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  saveStatus: "saved" | "saving" | "unsaved" | "failed";
  onRetrySave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPreflight: () => void;
  onOpenReview: () => void;
  onOpenExport: () => void;
  onSchedule: () => void;
}

export function StudioToolbar({
  title,
  onTitleChange,
  saveStatus,
  onRetrySave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPreflight,
  onOpenReview,
  onOpenExport,
  onSchedule,
}: StudioToolbarProps) {
  return (
    <header className="min-h-16 py-3 flex-wrap bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Back Link & Editable Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard/carousels"
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          title="Back to Carousels Hub"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={title}
            aria-label="Carousel title"
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent hover:bg-zinc-800/60 focus:bg-zinc-800 px-2 py-1 rounded-lg text-sm font-bold text-white border border-transparent hover:border-zinc-700 focus:border-amber-500 focus:outline-none truncate max-w-xs sm:max-w-md transition"
          />

          {/* Save Status Pill */}
          <div className="shrink-0">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Saved
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-[11px] font-medium text-zinc-400">
                Unsaved changes
              </span>
            )}
            {saveStatus === "failed" && (
              <button
                type="button"
                onClick={onRetrySave}
                className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                Save failed (Retry)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center: Undo / Redo */}
      <div className="hidden sm:flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPreflight}
          title="Run Preflight Validation"
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Preflight
        </button>

        <button
          type="button"
          onClick={onOpenReview}
          title="Share for Client Review"
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          Review Link
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <button
          type="button"
          onClick={onSchedule}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Calendar className="w-3.5 h-3.5" />
          Schedule
        </button>
      </div>
    </header>
  );
}
