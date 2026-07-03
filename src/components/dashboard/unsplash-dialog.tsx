"use client";

import { useMemo, useState } from "react";
import { Search, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ImportedFile } from "./canva-dialog";

interface UnsplashDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: ImportedFile[]) => void;
}

const PHOTO_POOL = [
  "1521737604893-d14cc237f11d",
  "1504384308090-c894fdcc538d",
  "1499951360447-b19be8fe80f5",
  "1497366216548-37526070297c",
  "1504384308090-c894fdcc538d",
  "1519389950473-47ba0277781c",
  "1542744173-8e7e53415bb0",
  "1554189097-9e84b8a8f7c9",
  "1556761175-5973dc0f32e7",
  "1542744095-fcf48d80b0fd",
  "1515378791036-0648a3ef77b2",
  "1543269865-cbf542effbb0",
  "1486312338219-ce68d2c6f44d",
  "1531297484001-51dee177b52a",
  "1517048676732-d65bc937f952",
  "1521737711867-e3b97375f902",
  "1499951360447-b19be8fe80f5",
  "1556761175-b413da4baf72",
  "1497032205916-ac775f0649a2",
  "1485217988980-11786ced9454",
  "1497032628192-86f99bcd76bc",
  "1531538606174-0f0ff2dccb3d",
  "1487309078313-2f2b0f1a1a17",
  "1494790108377-be9c29b29330",
  "1487412720507-e7ab37603c6f",
];

export function UnsplashDialog({ open, onClose, onImport }: UnsplashDialogProps) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function reset() {
    setQuery("");
    setSearched(false);
    setSelected(new Set());
  }
  function handleClose() {
    reset();
    onClose();
  }

  const results = useMemo(() => {
    if (!searched) return [];
    // Derive 12 photo IDs from a base pool, ensuring reproducible URLs
    const seed = query.trim() || "general";
    return Array.from({ length: 12 }).map((_, i) => {
      const id = PHOTO_POOL[(seed.charCodeAt(0) + i) % PHOTO_POOL.length];
      const safeId = id;
      return {
        id: `u-${i}-${safeId}`,
        thumbUrl: `https://picsum.photos/seed/${safeId}-${i}/400/400`,
        fullUrl: `https://picsum.photos/seed/${safeId}-${i}/1200/1200`,
        name: `${query.trim() || "Unsplash"} photo ${i + 1}.jpg`,
      };
    });
  }, [searched, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    const items: ImportedFile[] = results
      .filter((r) => selected.has(r.id))
      .map((r) => ({ url: r.fullUrl, name: r.name, mimeType: "image/jpeg" }));
    onImport(items);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <UnsplashLogo />
          <span>Import from Unsplash</span>
        </div>
      }
      description={`${selected.size} of ${results.length || "—"} photo${results.length === 1 ? "" : "s"} selected`}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-zinc-500">
          <span>Photos provided by Unsplash</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleImport}
              className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selected.size} Photo{selected.size === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) setSearched(true);
              }}
              placeholder="Search for photos… (e.g. coffee, sunset, beach)"
              className="w-full h-10 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>
          <button
            type="button"
            onClick={() => query.trim() && setSearched(true)}
            disabled={!query.trim()}
            className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>

        {/* Grid */}
        <div className="min-h-[280px] rounded-md border border-zinc-200 bg-zinc-50/40">
          {searched ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
              {results.map((r) => {
                const isSel = selected.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggle(r.id)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden bg-zinc-200 ring-2 transition-all",
                      isSel ? "ring-zinc-950 shadow-md" : "ring-transparent hover:ring-zinc-300"
                    )}
                  >
                    <img
                      src={r.thumbUrl}
                      alt={r.name}
                      className="size-full object-cover"
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    {isSel ? (
                      <div className="absolute top-1.5 right-1.5 size-6 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs shadow-sm">
                        ✓
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <ImageIcon className="size-8 text-zinc-300 mb-2" />
              <p className="text-sm font-medium text-zinc-700">Search for photos to get started</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
                Try "coffee", "sunset", "beach" — or any topic you'd like to share.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function UnsplashLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
      <path d="M28 6h12v12h-4V14h-8V6zM16 6H4v12h4v-4h8V6z" fill="#000" />
      <circle cx="24" cy="30" r="12" fill="#000" />
    </svg>
  );
}
