"use client";

import { useCallback, useRef, useState } from "react";
import { X, Upload, GripVertical, ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepCircle } from "@/components/dashboard/step-circle";

export interface CarouselItem {
  id: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video";
  cdnUrl?: string;
  uploadStatus: "pending" | "uploading" | "ready" | "error";
  uploadProgress?: number;
}

const CAROUSEL_MIN = 2;
const CAROUSEL_MAX = 10;
const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB per file

interface CarouselMediaCardProps {
  items: CarouselItem[];
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
}

export function CarouselMediaCard({
  items,
  onAddFiles,
  onRemove,
  onReorder,
}: CarouselMediaCardProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      const files = Array.from(e.dataTransfer.files ?? []).filter(
        (f) =>
          f.type.startsWith("image/") ||
          f.type.startsWith("video/mp4") ||
          f.type === "video/mp4"
      );
      if (files.length > 0) onAddFiles(files);
    },
    [onAddFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onAddFiles(files);
    e.target.value = "";
  };

  const canAdd = items.length < CAROUSEL_MAX;

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-4">
        {/* Info banner */}
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Carousel posts are supported on Instagram, Facebook, and Threads only.
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StepCircle n={1} />
            <h3 className="text-lg font-semibold leading-none">Media</h3>
            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
              Carousel
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {items.length} / {CAROUSEL_MAX} slides
          </span>
        </div>

        {/* Dropzone */}
        {canAdd && (
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
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              draggingOver
                ? "border-blue-400 bg-blue-50/40"
                : "border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center">
                <Upload className="size-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700">
                Drop images or videos here
              </p>
              <p className="text-xs text-zinc-400">
                JPG, PNG, WEBP, MP4 · min {CAROUSEL_MIN}, max {CAROUSEL_MAX} slides · 30 MB each
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                Browse Files
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Slide strip */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Slides — drag to reorder
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragFromIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragFromIdx !== null && dragFromIdx !== idx) {
                      onReorder(dragFromIdx, idx);
                    }
                    setDragFromIdx(null);
                  }}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden border-2 group cursor-grab transition-all",
                    item.uploadStatus === "error"
                      ? "border-red-400"
                      : "border-zinc-200 hover:border-zinc-400",
                    dragFromIdx === idx && "opacity-50 scale-95"
                  )}
                >
                  {/* Thumbnail */}
                  {item.kind === "image" ? (
                    <img
                      src={item.previewUrl}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-1">
                      <Video className="size-6 text-white/70" />
                      <span className="text-[10px] text-white/60">Video</span>
                    </div>
                  )}

                  {/* Slide number */}
                  <div className="absolute top-1 left-1 size-5 rounded-full bg-zinc-950/70 flex items-center justify-center text-white text-[10px] font-bold">
                    {idx + 1}
                  </div>

                  {/* Upload progress overlay */}
                  {item.uploadStatus === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                      <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${item.uploadProgress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-white text-[10px]">
                        {item.uploadProgress ?? 0}%
                      </span>
                    </div>
                  )}

                  {/* Error state */}
                  {item.uploadStatus === "error" && (
                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">Error</span>
                    </div>
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="size-3 text-white drop-shadow" />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    aria-label={`Remove slide ${idx + 1}`}
                    onClick={() => onRemove(item.id)}
                    className="absolute -top-1.5 -right-1.5 size-5 inline-flex items-center justify-center rounded-full bg-zinc-950 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              {canAdd && items.length >= CAROUSEL_MIN && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 flex flex-col items-center justify-center gap-1 transition-colors text-zinc-400"
                >
                  <ImageIcon className="size-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>

            {/* Validation hint */}
            {items.length < CAROUSEL_MIN && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <span>⚠️</span> Add at least {CAROUSEL_MIN} slides to publish a carousel
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
