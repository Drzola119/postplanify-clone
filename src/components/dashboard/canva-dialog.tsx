"use client";

import { useMemo, useState } from "react";
import { Search, Folder, Clock, Users, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export type ImportedFile = { url: string; name: string; mimeType?: string };

interface CanvaDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: ImportedFile[]) => void;
}

type Tab = "recent" | "designs" | "folders" | "shared";

const CANVA_BRAND = "#00C4CC";

const DEMO_DESIGNS: { id: string; name: string; tab: Tab; updated: string; gradient: string }[] = [
  { id: "d1", name: "Spring Sale Instagram Post", tab: "recent", updated: "2 hours ago", gradient: "from-pink-400 to-orange-400" },
  { id: "d2", name: "Product Launch Story", tab: "recent", updated: "Yesterday", gradient: "from-violet-400 to-blue-400" },
  { id: "d3", name: "Weekly Motivation", tab: "designs", updated: "3 days ago", gradient: "from-emerald-400 to-cyan-400" },
  { id: "d4", name: "Black Friday Banner", tab: "designs", updated: "Last week", gradient: "from-zinc-800 to-zinc-600" },
  { id: "d5", name: "Carousel Slide — Tips", tab: "designs", updated: "2 weeks ago", gradient: "from-amber-300 to-rose-400" },
  { id: "d6", name: "Quote of the Day", tab: "designs", updated: "3 weeks ago", gradient: "from-indigo-400 to-purple-400" },
  { id: "d7", name: "Team Photo Collage", tab: "shared", updated: "Last month", gradient: "from-teal-400 to-emerald-400" },
  { id: "d8", name: "Holiday Greetings Card", tab: "shared", updated: "Last month", gradient: "from-red-400 to-rose-400" },
  { id: "d9", name: "Onboarding Story", tab: "folders", updated: "2 months ago", gradient: "from-sky-400 to-blue-500" },
  { id: "d10", name: "Q4 Recap", tab: "folders", updated: "2 months ago", gradient: "from-fuchsia-400 to-pink-400" },
  { id: "d11", name: "Recipe Card Template", tab: "folders", updated: "3 months ago", gradient: "from-lime-400 to-emerald-400" },
  { id: "d12", name: "New Feature Hero", tab: "recent", updated: "3 months ago", gradient: "from-blue-500 to-indigo-500" },
];

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "designs", label: "My designs", icon: ImageIcon },
  { id: "folders", label: "Folders", icon: Folder },
  { id: "shared", label: "Shared", icon: Users },
];

export function CanvaDialog({ open, onClose, onImport }: CanvaDialogProps) {
  const [tab, setTab] = useState<Tab>("recent");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function reset() {
    setTab("recent");
    setSearch("");
    setSelected(new Set());
  }

  function handleClose() {
    reset();
    onClose();
  }

  const visible = useMemo(() => {
    const list = DEMO_DESIGNS.filter((d) => d.tab === tab);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((d) => d.name.toLowerCase().includes(q));
  }, [tab, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    const items: ImportedFile[] = DEMO_DESIGNS.filter((d) => selected.has(d.id)).map((d) => ({
      url: `https://picsum.photos/seed/${d.id}/1200/1200`,
      name: `${d.name}.png`,
      mimeType: "image/png",
    }));
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
          <CanvaLogo />
          <span>Import from Canva</span>
        </div>
      }
      description={`${selected.size} of ${visible.length} design${visible.length === 1 ? "" : "s"} selected`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
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
            className="inline-flex items-center justify-center rounded-md text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: CANVA_BRAND }}
          >
            Import {selected.size} Design{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-3 h-8 text-xs font-medium transition-colors",
                    active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search designs…"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="min-h-[320px] max-h-[480px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-zinc-500">
              <ImageIcon className="size-8 text-zinc-300 mb-2" />
              <p className="text-sm">No designs match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visible.map((d) => {
                const isSel = selected.has(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggle(d.id)}
                    className={cn(
                      "group relative rounded-lg overflow-hidden border-2 bg-white text-left transition-all",
                      isSel ? "border-zinc-950 shadow-md" : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className={cn("aspect-square bg-gradient-to-br", d.gradient)}>
                      <div className="size-full flex items-center justify-center">
                        <span className="text-white text-3xl font-bold opacity-30">Aa</span>
                      </div>
                    </div>
                    {/* Meta */}
                    <div className="p-2 space-y-0.5">
                      <p className="text-xs font-medium text-zinc-900 truncate">{d.name}</p>
                      <p className="text-[10px] text-zinc-500">{d.updated}</p>
                    </div>
                    {/* Selected badge */}
                    {isSel ? (
                      <div
                        className="absolute top-1.5 right-1.5 size-6 rounded-full text-white flex items-center justify-center text-xs shadow-sm"
                        style={{ backgroundColor: CANVA_BRAND }}
                      >
                        ✓
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CanvaLogo() {
  return (
    <img
      src="https://cdn.simpleicons.org/canva/00C4CC"
      alt="Canva"
      width={22}
      height={22}
      loading="lazy"
      decoding="async"
      style={{ width: 22, height: 22 }}
      className="shrink-0"
    />
  );
}
