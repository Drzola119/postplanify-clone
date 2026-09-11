"use client";
import { useEffect, useState } from "react";
import {
  ASPECT_RATIO_DIMENSIONS,
  type CarouselDocument,
  type CarouselSlideItem,
  type BrandKit,
} from "@/lib/carousel-gen/types";
import { editableDocument } from "./use-draft-save";
export function SlideCanvas({
  deck,
  slide,
  slideIndex,
  showSafeZones,
  onEdit,
}: {
  deck: CarouselDocument;
  slide: CarouselSlideItem;
  slideIndex: number;
  totalSlides: number;
  showSafeZones?: boolean;
  brandKit?: BrandKit;
  onEdit?: (updates: Partial<CarouselSlideItem>) => void;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [zoom, setZoom] = useState(100),
    [issues, setIssues] = useState<string[]>([]);
  const digest = JSON.stringify({
    ...editableDocument(deck),
    brandSnapshot: deck.brandSnapshot,
  });
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/carousels/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deck: JSON.parse(digest), index: slideIndex }),
          signal: abort.signal,
        });
        const result = await response.json();
        if (!response.ok)
          throw Error(result.error?.message || "Preview failed");
        setUrl(result.dataUrl);
        setIssues(result.issues || []);
      } catch (e) {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : "Preview failed");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [digest, slideIndex]);
  const dims = ASPECT_RATIO_DIMENSIONS[deck.aspectRatio];
  return (
    <div className="w-full max-w-xl space-y-3">
      <label className="flex gap-3 text-sm">
        Preview size{" "}
        <input
          aria-label="Preview size"
          type="range"
          min="50"
          max="100"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        {zoom}%
      </label>
      <div
        className="relative mx-auto shadow-xl"
        style={{
          width: `${zoom}%`,
          aspectRatio: `${dims.width}/${dims.height}`,
        }}
      >
        {url ? (
          <img
            src={url}
            alt={`Slide ${slideIndex + 1}: ${slide.headline || "Original artwork"}`}
            className="w-full h-full"
            onDoubleClick={() =>
              onEdit &&
              !slide.isLegacyFlat &&
              !slide.isLocked &&
              setEditing(true)
            }
          />
        ) : (
          <div role="status" className="p-8">
            Rendering preview…
          </div>
        )}
        {showSafeZones && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-square border-2 border-dashed border-fuchsia-500 pointer-events-none" />
        )}
        {editing && (
          <div className="absolute inset-4 bg-zinc-950/95 p-4 space-y-4 overflow-auto">
            <label className="block">
              Headline
              <textarea
                className="w-full bg-zinc-800 p-2"
                value={slide.headline}
                onChange={(e) => onEdit?.({ headline: e.target.value })}
              />
            </label>
            <label className="block">
              Body
              <textarea
                className="w-full bg-zinc-800 p-2"
                rows={8}
                value={slide.body || ""}
                onChange={(e) => onEdit?.({ body: e.target.value })}
              />
            </label>
            <button onClick={() => setEditing(false)}>Done editing</button>
          </div>
        )}
      </div>
      {slide.isLegacyFlat ? (
        <p className="text-sm">
          Original flattened artwork. Text is embedded in the image. Add a new
          editable slide to replace it.
        </p>
      ) : (
        onEdit && (
          <button
            disabled={slide.isLocked}
            onClick={() => setEditing(true)}
            className="text-sm underline"
          >
            Edit slide text
          </button>
        )
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {issues.map((issue) => (
        <p role="alert" key={issue} className="text-amber-300">
          {issue}
        </p>
      ))}
    </div>
  );
}
