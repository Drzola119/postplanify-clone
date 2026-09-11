"use client";
import { useModalFocus } from "./use-modal-focus";

import { useState } from "react";
import { Download, FileText, Archive, Loader2, X } from "lucide-react";
import type { CarouselDocument } from "@/lib/carousel-gen/types";
import {
  exportCarouselToZip,
  exportCarouselToPdf,
} from "@/lib/carousel-gen/export-service";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: CarouselDocument;
  activeSlideIndex?: number;
  renderSlideToDataUrl: (slideIndex: number) => Promise<string>;
}

export function ExportModal({
  isOpen,
  onClose,
  deck,
  activeSlideIndex = 0,
  renderSlideToDataUrl,
}: ExportModalProps) {
  const [exportingType, setExportingType] = useState<
    "zip" | "pdf" | "single" | null
  >(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number>(0);

  const modalRef = useModalFocus(isOpen, onClose);
  if (!isOpen) return null;

  async function handleExportZip() {
    try {
      setError("");
      setExportingType("zip");
      setProgress(10);

      const slideUrls: string[] = [];
      for (let i = 0; i < deck.slides.length; i++) {
        const url = await renderSlideToDataUrl(i);
        slideUrls.push(url);
        setProgress(10 + Math.round(((i + 1) / deck.slides.length) * 70));
      }

      const zipBlob = await exportCarouselToZip(deck, slideUrls);
      setProgress(100);

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${deck.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "carousel"}-png-deck.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingType(null);
      setProgress(0);
    }
  }

  async function handleExportPdf() {
    try {
      setError("");
      setExportingType("pdf");
      setProgress(10);

      const slideUrls: string[] = [];
      for (let i = 0; i < deck.slides.length; i++) {
        const url = await renderSlideToDataUrl(i);
        slideUrls.push(url);
        setProgress(10 + Math.round(((i + 1) / deck.slides.length) * 70));
      }

      const pdfBlob = await exportCarouselToPdf(deck, slideUrls);
      setProgress(100);

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${deck.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "carousel"}-deck.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingType(null);
      setProgress(0);
    }
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Export carousel"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-white">
              Export Carousel Assets
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Option 1: Multi-Page PDF */}
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportPdf}
            className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-left transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                  Multi-Page PDF Document
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Exact {deck.aspectRatio} dimensions for LinkedIn documents &
                  client decks.
                </p>
              </div>
            </div>
            {exportingType === "pdf" ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white" />
            )}
          </button>

          {/* Option 2: High-Res PNG ZIP */}
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportZip}
            className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-left transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                  High-Res PNG ZIP Archive
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ordered slides (01-hook.png, etc.) + caption metadata for
                  Instagram/TikTok.
                </p>
              </div>
            </div>
            {exportingType === "zip" ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Download className="w-4 h-4 text-zinc-500 group-hover:text-white" />
            )}
          </button>

          <button
            disabled={exportingType !== null}
            className="w-full p-4 border rounded-xl text-left"
            onClick={async () => {
              setExportingType("single");
              setError("");
              try {
                const url = await renderSlideToDataUrl(activeSlideIndex);
                const a = document.createElement("a");
                a.href = url;
                a.download = `slide-${activeSlideIndex + 1}.png`;
                a.click();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Export failed");
              } finally {
                setExportingType(null);
              }
            }}
          >
            Download current slide as PNG
          </button>
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          {/* Progress bar if active */}
          {exportingType && (
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Rendering slides...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
