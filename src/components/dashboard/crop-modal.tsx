"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, RotateCcw, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface CropModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onApply?: (croppedDataUrl: string) => void;
}

const ASPECTS = [
  { id: "free", label: "Freeform", ratio: null as number | null },
  { id: "1:1", label: "1:1 Square", ratio: 1 },
  { id: "4:5", label: "4:5 Portrait", ratio: 4 / 5 },
  { id: "9:16", label: "9:16 Story", ratio: 9 / 16 },
  { id: "16:9", label: "16:9 Landscape", ratio: 16 / 9 },
];

const CROPPED_MAX_DIM = 2048;

export function CropModal({ open, onClose, imageUrl, onApply }: CropModalProps) {
  const [aspect, setAspect] = useState("free");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      setAspect("free");
      setZoom(100);
      setRotation(0);
      setImgLoaded(false);
      setIsApplying(false);
    }
  }, [open]);

  // Preload the image once for canvas access (loading via <img> is async,
  // and we need ImageData ready before painting).
  useEffect(() => {
    if (!open || !imageUrl) {
      imgRef.current = null;
      setImgLoaded(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      imgRef.current = null;
      setImgLoaded(false);
    };
    img.src = imageUrl;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [open, imageUrl]);

  async function handleApply() {
    const img = imgRef.current;
    if (!img || !imgLoaded || !imageUrl) return;
    setIsApplying(true);
    try {
      const ratio = ASPECTS.find((a) => a.id === aspect)?.ratio ?? null;
      const cropped = await renderCrop(img, ratio, zoom, rotation);
      onApply?.(cropped);
      onClose();
    } catch (err) {
      console.error("Crop failed:", err);
      // Fall back to no-op so the user isn't stuck in the modal.
      onClose();
    } finally {
      setIsApplying(false);
    }
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
            disabled={!imageUrl || !imgLoaded || isApplying}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-3 h-9 text-sm font-medium disabled:opacity-50"
          >
            <Check className="size-3.5" />
            {isApplying ? "Applying…" : "Apply Crop"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {imageUrl ? (
          <div className="relative w-full h-80 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center">
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

/**
 * Render the source image to a canvas with the chosen aspect, zoom, and
 * rotation, then return a JPEG data URL. The output is bounded to
 * CROPPED_MAX_DIM on the longest edge so we don't produce huge blobs for
 * social-media uploads.
 */
async function renderCrop(
  img: HTMLImageElement,
  ratio: number | null,
  zoomPct: number,
  rotationDeg: number,
): Promise<string> {
  const SW = img.naturalWidth;
  const SH = img.naturalHeight;
  if (!SW || !SH) throw new Error("Image has zero dimensions");

  // Source rect after rotation. When rotating 90/270, swap width/height.
  const rot = ((rotationDeg % 360) + 360) % 360;
  const swapped = rot === 90 || rot === 270;
  const rotatedW = swapped ? SH : SW;
  const rotatedH = swapped ? SW : SH;

  // Output target rect:
  //  - if ratio is set, fit the rotated image into ratio and crop the
  //    excess (max-center).
  //  - if ratio is null, use the rotated image as-is.
  const sourceRatio = rotatedW / rotatedH;
  const outRatio = ratio ?? sourceRatio;
  let dstW: number;
  let dstH: number;
  if (sourceRatio > outRatio) {
    // Source is wider — crop sides.
    dstH = rotatedH;
    dstW = Math.round(rotatedH * outRatio);
  } else {
    // Source is taller — crop top/bottom.
    dstW = rotatedW;
    dstH = Math.round(rotatedW / outRatio);
  }

  // Apply zoom: zoom IN crops, zoom OUT shows more. Easy model: scale the
  // destination down by (zoom/100) — at 50% the visible region is 2x wider.
  const z = zoomPct / 100;
  const finalW = Math.max(1, Math.round(dstW * z));
  const finalH = Math.max(1, Math.round(dstH * z));

  // Cap to CROPPED_MAX_DIM on the longest edge for upload.
  const longest = Math.max(finalW, finalH);
  const scaleCap = longest > CROPPED_MAX_DIM ? CROPPED_MAX_DIM / longest : 1;
  const outW = Math.round(finalW * scaleCap);
  const outH = Math.round(finalH * scaleCap);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Draw rotated image.
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.9);
}
