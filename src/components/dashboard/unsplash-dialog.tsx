"use client";

import { useState } from "react";
import { Search, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface UnsplashDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UnsplashDialog({ open, onClose }: UnsplashDialogProps) {
  const { toast } = useToast();
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import from Unsplash"
      size="xl"
      footer={
        <div className="w-full flex items-center justify-between text-xs text-zinc-500">
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
              onClick={() => {
                toast({
                  title: `Imported ${selected.size} photo${selected.size > 1 ? "s" : ""}`,
                  tone: "success",
                });
                handleClose();
              }}
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
              placeholder="Search for photos…"
              className="w-full h-10 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>
          <button
            type="button"
            onClick={() => query.trim() && setSearched(true)}
            className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-10 text-sm font-medium"
          >
            Search
          </button>
        </div>

        {/* Grid */}
        <div className="min-h-[280px] rounded-md border border-dashed border-zinc-200 bg-zinc-50/40 flex flex-col items-center justify-center text-center py-12">
          {searched ? (
            <div className="grid grid-cols-3 gap-3 w-full">
              {Array.from({ length: 6 }).map((_, i) => {
                const id = `u-${i}`;
                const isSel = selected.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    }}
                    className={`relative aspect-square rounded-md overflow-hidden bg-zinc-200 ring-2 transition-all ${
                      isSel ? "ring-zinc-950" : "ring-transparent hover:ring-zinc-300"
                    }`}
                  >
                    <div className="size-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
                    {isSel ? (
                      <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-zinc-950 text-white text-xs flex items-center justify-center">
                        ✓
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <ImageIcon className="size-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">
                Search for photos to get started
              </p>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
