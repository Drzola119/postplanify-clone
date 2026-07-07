"use client";

import { useState, useRef, useEffect } from "react";
import { Crop, RotateCcw, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface CropModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onApply?: (croppedDataUrl: string) => void;
}

const ASPECTS = [
  { id: "free", label: "Freeform" },
  { id: "1:1", label: "1:1 Square" },
  { id: "4:5", label: "4:5 Portrait" },
  { id: "9:16", label: "9:16 Story" },
  { id: "16:9", label: "16:9 Landscape" },
];

export function CropModal({ open, onClose, imageUrl, onApply }: CropModalProps) {
  const [aspect, setAspect] = useState("free");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setAspect("free");
      setZoom(100);
      setRotation(0);
    }
  }, [open]);

  function handleApply() {
    onApply?.(imageUrl ?? "");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Crop className="size-4" />
          Crop Image
        </span>
      }
      description="Adjust the crop, aspect ratio, and rotation before applying"
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!imageUrl}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-3 h-9 text-sm font-medium disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Apply Crop
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {imageUrl ? (
          <div
            ref={containerRef}
            className="relative w-full h-80 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Crop preview"
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
            />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10" />
          </div>
        ) : (
          <div className="w-full h-80 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-sm text-zinc-500">
            No image to crop
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-700">Aspect ratio</p>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspect(a.id)}
                className={`inline-flex items-center rounded-md border px-3 h-8 text-xs font-medium ${
                  aspect === a.id
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-700">Zoom</p>
              <span className="text-xs text-zinc-500">{zoom}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value, 10))}
              className="w-full h-1 accent-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-700">Rotation</p>
              <span className="text-xs text-zinc-500">{rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              className="w-full h-1 accent-zinc-950"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setZoom(100);
            setRotation(0);
            setAspect("free");
          }}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
        >
          <RotateCcw className="size-3" />
          Reset adjustments
        </button>
      </div>
    </Modal>
  );
}