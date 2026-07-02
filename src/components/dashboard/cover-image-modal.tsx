"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { RotateCcw, Play, Pause } from "lucide-react";

interface CoverImageModalProps {
  open: boolean;
  videoUrl: string | null;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

export function CoverImageModal({ open, videoUrl, onClose, onApply }: CoverImageModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!open) {
      setTime(0);
      setPlaying(false);
    }
  }, [open]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function reset() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setTime(0);
  }

  function handleSeek(value: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setTime(value);
  }

  function captureFrame(): string | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    try {
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return null;
    }
  }

  function handleApply() {
    const dataUrl = captureFrame();
    if (dataUrl) {
      onApply(dataUrl);
    }
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Cover Image"
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium"
          >
            Apply Cover Image
          </button>
        </div>
      }
    >
      {videoUrl ? (
        <div className="space-y-4">
          {/* Vertical 9:16 preview */}
          <div className="flex justify-center bg-zinc-50 rounded-md p-4">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-h-[420px] w-auto aspect-[9/16] bg-black rounded"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.duration && Number.isFinite(v.duration)) setDuration(v.duration);
              }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onEnded={() => setPlaying(false)}
              muted
              playsInline
              crossOrigin="anonymous"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center justify-center size-9 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          </div>

          {/* Scrub bar */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={time}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 accent-zinc-950 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{fmt(time)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}