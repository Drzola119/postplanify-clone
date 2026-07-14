"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepCircle } from "@/components/dashboard/step-circle";

export type TrialReelMode =
  | "CUSTOM"
  | "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED"
  | "TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS";

const TRIAL_OPTIONS: {
  value: TrialReelMode;
  label: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: "CUSTOM",
    label: "Custom (Standard Reel)",
    description: "Posts as a normal Reel with no trial logic.",
  },
  {
    value: "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED",
    label: "Share to Followers if Liked",
    description: "Instagram shares to your followers automatically if the trial performs well.",
    recommended: true,
  },
  {
    value: "TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS",
    label: "Don't Share to Followers",
    description: "Tested with non-followers only — stays private to your feed.",
  },
];

export interface TrialReelFile {
  file: File;
  previewUrl: string;
  cdnUrl?: string;
  uploadStatus: "pending" | "uploading" | "ready" | "error";
  uploadProgress?: number;
}

interface TrialReelCardProps {
  videoFile: TrialReelFile | null;
  trialMode: TrialReelMode;
  onVideoFile: (file: File) => void;
  onRemoveVideo: () => void;
  onTrialModeChange: (mode: TrialReelMode) => void;
}

export function TrialReelCard({
  videoFile,
  trialMode,
  onVideoFile,
  onRemoveVideo,
  onTrialModeChange,
}: TrialReelCardProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      const file = Array.from(e.dataTransfer.files ?? []).find((f) =>
        f.type.startsWith("video/")
      );
      if (file) onVideoFile(file);
    },
    [onVideoFile]
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StepCircle n={1} />
            <h3 className="text-lg font-semibold leading-none">Media</h3>
            <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Zap className="size-3" /> Trial Reel · Instagram Only
            </span>
          </div>
        </div>

        {/* Video upload area */}
        {!videoFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingOver(true);
            }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              draggingOver
                ? "border-amber-400 bg-amber-50/40"
                : "border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Zap className="size-6 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Drop a video here</p>
              <p className="text-xs text-zinc-400">MP4, MOV, WEBM · Portrait recommended (9:16)</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                Browse Video
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[9/16] max-h-64">
            <video
              src={videoFile.previewUrl}
              className="w-full h-full object-contain"
              controls
            />
            {/* Upload progress */}
            {videoFile.uploadStatus === "uploading" && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${videoFile.uploadProgress ?? 0}%` }}
                  />
                </div>
                <p className="text-white text-xs mt-1">{videoFile.uploadProgress ?? 0}% uploading…</p>
              </div>
            )}
            {/* Remove */}
            <button
              type="button"
              onClick={onRemoveVideo}
              className="absolute top-2 right-2 size-7 rounded-full bg-zinc-950/70 text-white flex items-center justify-center hover:bg-zinc-950 transition-colors"
            >
              <X className="size-4" />
            </button>
            {/* Ready badge */}
            {videoFile.uploadStatus === "ready" && (
              <div className="absolute top-2 left-2 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                ✓ Ready
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onVideoFile(file);
            e.target.value = "";
          }}
        />

        {/* Trial Mode selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-500" />
            <p className="text-sm font-semibold text-zinc-800">Trial Mode</p>
            <span className="text-xs text-zinc-400">— What happens after Instagram tests it?</span>
          </div>
          <div className="space-y-2">
            {TRIAL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  trialMode === opt.value
                    ? "border-zinc-950 bg-zinc-50"
                    : "border-zinc-200 hover:bg-zinc-50/60"
                )}
              >
                <input
                  type="radio"
                  name="trial_mode"
                  value={opt.value}
                  checked={trialMode === opt.value}
                  onChange={() => onTrialModeChange(opt.value)}
                  className="mt-0.5 size-4 border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
                    {opt.recommended && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                        ⭐ Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="size-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>What are Trial Reels?</strong> Instagram tests your Reel with non-followers first.
            If it performs well, it can automatically reach your followers — giving you organic reach
            without risking your existing audience metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
