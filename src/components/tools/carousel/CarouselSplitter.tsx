"use client";

import * as React from "react";
import { Upload, Download, RefreshCw, Grid3x3, Square, RectangleVertical, RectangleHorizontal, X, FileImage, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/cta-button";

type Aspect = "1:1" | "4:5" | "16:9";

const ASPECT_RATIOS: Record<Aspect, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

const ASPECT_LABEL: Record<Aspect, string> = {
  "1:1": "Square (1080×1080)",
  "4:5": "Portrait (1080×1350)",
  "16:9": "Landscape (1080×608)",
};

// Compute a grid layout that roughly fills a rectangular source image with N tiles
// using the chosen aspect ratio. We pick rows × cols such that rows*cols >= N and the
// grid aspect ratio is as close to the source aspect as possible while keeping the
// tile aspect ratio intact.
function computeLayout(count: number, sourceAspect: number, tileAspect: number) {
  // We'll iterate candidates and score them by grid_fit to source
  let best = { rows: 1, cols: count };
  let bestScore = Infinity;
  for (let rows = 1; rows <= count; rows++) {
    const cols = Math.ceil(count / rows);
    const gridAspect = (cols * tileAspect) / rows;
    const score = Math.abs(Math.log(gridAspect / sourceAspect));
    if (score < bestScore) {
      bestScore = score;
      best = { rows, cols };
    }
  }
  return best;
}

export function CarouselSplitter() {
  const [file, setFile] = React.useState<File | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number } | null>(null);
  const [slideCount, setSlideCount] = React.useState(5);
  const [aspect, setAspect] = React.useState<Aspect>("1:1");
  const [dragOver, setDragOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [tiles, setTiles] = React.useState<{ dataUrl: string; index: number }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load image when file changes
  React.useEffect(() => {
    if (!file) {
      setImageUrl(null);
      setNaturalSize(null);
      setTiles([]);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WebP, GIF).");
      return;
    }
    setFile(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // Compute tile preview canvases whenever image / count / aspect changes
  React.useEffect(() => {
    if (!imageUrl || !naturalSize) {
      setTiles([]);
      return;
    }
    let cancelled = false;
    const tileAspect = ASPECT_RATIOS[aspect];
    const { rows, cols } = computeLayout(slideCount, naturalSize.w / naturalSize.h, tileAspect);

    // We'll render each tile to a canvas. To stay snappy we use a moderate output size.
    const TILE_LONG_EDGE = 800; // px on the longest edge — plenty for preview + download
    const tileW = TILE_LONG_EDGE;
    const tileH = aspect === "1:1" ? TILE_LONG_EDGE : Math.round(TILE_LONG_EDGE / tileAspect);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      // Source image is sliced into a rows×cols grid (the source aspect = rows×cols roughly).
      const tilePixelW = img.width / cols;
      const tilePixelH = img.height / rows;
      const out: { dataUrl: string; index: number }[] = [];
      let loaded = 0;
      const total = slideCount;
      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const canvas = document.createElement("canvas");
        canvas.width = tileW;
        canvas.height = tileH;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        // Fill white background so PNG/JPG transparency is consistent
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tileW, tileH);
        // Compute the crop rectangle from the source tile, centered to match tileAspect
        const cropW = Math.min(tilePixelW, tilePixelH * tileAspect);
        const cropH = Math.min(tilePixelH, tilePixelW / tileAspect);
        const sx = c * tilePixelW + (tilePixelW - cropW) / 2;
        const sy = r * tilePixelH + (tilePixelH - cropH) / 2;
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, tileW, tileH);
        const dataUrl = canvas.toDataURL("image/png");
        out.push({ dataUrl, index: i + 1 });
        loaded++;
        if (loaded === total) {
          out.sort((a, b) => a.index - b.index);
          setTiles(out);
        }
      }
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl, naturalSize, slideCount, aspect]);

  const downloadTile = (tile: { dataUrl: string; index: number }) => {
    const a = document.createElement("a");
    a.href = tile.dataUrl;
    a.download = `carousel-slide-${String(tile.index).padStart(2, "0")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = async () => {
    if (tiles.length === 0) return;
    setBusy(true);
    try {
      // Download as a sequence (browser limitation: native zip needs a lib).
      // We sequentially trigger downloads ~50ms apart so browsers don't block them.
      for (const t of tiles) {
        downloadTile(t);
        await new Promise((r) => setTimeout(r, 120));
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTiles([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`group flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-10 sm:p-14 cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/40"
          }`}
        >
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Upload className="size-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-1">Drop your image here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse — JPG, PNG, WebP, GIF up to 20 MB
          </p>
          <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 h-10 text-sm font-medium text-primary-foreground">
            <FileImage className="size-4" />
            Choose image
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPick}
            className="hidden"
          />
        </div>
      )}

      {/* Loaded: settings + preview */}
      {file && imageUrl && naturalSize && (
        <>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <FileImage className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {naturalSize.w} × {naturalSize.h} px · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
                Remove
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of slides: <span className="text-primary">{slideCount}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[3, 5, 7, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSlideCount(n)}
                        className={`text-xs px-2 h-7 rounded-md border transition-colors ${
                          slideCount === n
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Instagram supports 2–10 carousel slides.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aspect ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["1:1", "4:5", "16:9"] as Aspect[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAspect(a)}
                      className={`flex flex-col items-center gap-1 rounded-md border p-2 transition-colors ${
                        aspect === a
                          ? "border-primary bg-primary/5 text-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {a === "1:1" && <Square className="size-4" />}
                      {a === "4:5" && <RectangleVertical className="size-4" />}
                      {a === "16:9" && <RectangleHorizontal className="size-4" />}
                      <span className="text-xs font-medium">{a}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ASPECT_LABEL[aspect]}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadAll}
                disabled={busy || tiles.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Download {tiles.length} slides
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                Each tile is exported as PNG · 1080px on the long edge
              </span>
            </div>
          </Card>

          {/* Source image (hidden — used to drive natural-size state) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="hidden"
            onLoad={(e) => {
              const el = e.currentTarget;
              setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
            }}
          />

          {/* Source preview */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Grid3x3 className="size-4 text-primary" />
              <h3 className="font-semibold">Source image</h3>
              <span className="text-xs text-muted-foreground">
                ({naturalSize.w} × {naturalSize.h})
              </span>
            </div>
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Uploaded source"
                className="w-full h-auto object-contain block"
              />
              {/* Grid overlay */}
              <GridOverlay count={slideCount} aspect={aspect} />
            </div>
          </Card>

          {/* Tile previews */}
          {tiles.length > 0 && (
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-primary" />
                  <h3 className="font-semibold">Split preview · {tiles.length} tiles</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click any tile to download individually
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tiles.map((t) => (
                  <button
                    key={t.index}
                    type="button"
                    onClick={() => downloadTile(t)}
                    className="group relative rounded-lg border bg-muted/30 overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                  >
                    <div className="aspect-square relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.dataUrl}
                        alt={`Slide ${t.index}`}
                        className="absolute inset-0 size-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {String(t.index).padStart(2, "0")}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Download className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Bottom CTA */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground mb-3">
              Done splitting? Plan, schedule, and auto-publish your carousel with PostPlanify.
            </p>
            <CTAButton href="/signup" Icon={Upload}>
              Try PostPlanify Free
            </CTAButton>
          </div>
        </>
      )}
    </div>
  );
}

function GridOverlay({ count, aspect }: { count: number; aspect: Aspect }) {
  // Visual slice guides over the source image so users see the split.
  const tileAspect = ASPECT_RATIOS[aspect];
  const { rows, cols } = computeLayout(count, 16 / 9, tileAspect);
  const verticalLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const horizontalLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);
  return (
    <div className="absolute inset-0 pointer-events-none">
      {verticalLines.map((p, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
          style={{ left: `${p}%` }}
        />
      ))}
      {horizontalLines.map((p, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
          style={{ top: `${p}%` }}
        />
      ))}
    </div>
  );
}