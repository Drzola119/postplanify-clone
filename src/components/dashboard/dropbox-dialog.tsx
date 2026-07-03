"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronRight,
  Folder,
  Home,
  Users,
  Star,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File as FileIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ImportedFile } from "./canva-dialog";

interface DropboxDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: ImportedFile[]) => void;
}

type FolderId = "home" | "shared" | "starred" | "files";
type FileKind = "folder" | "image" | "video" | "pdf" | "doc" | "audio";

interface DropboxItem {
  id: string;
  name: string;
  kind: FileKind;
  folder: FolderId;
  size?: string;
  updated?: string;
}

const FOLDERS: { id: FolderId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "files", label: "All files", icon: Folder },
  { id: "shared", label: "Shared", icon: Users },
  { id: "starred", label: "Starred", icon: Star },
];

const ITEMS: DropboxItem[] = [
  { id: "f1", name: "Marketing", kind: "folder", folder: "home" },
  { id: "f2", name: "Brand assets", kind: "folder", folder: "home" },
  { id: "f3", name: "2026 launches", kind: "folder", folder: "home" },
  { id: "f4", name: "Team space", kind: "folder", folder: "shared" },
  { id: "i1", name: "Lifestyle — Cafe.jpg", kind: "image", folder: "home", size: "3.1 MB", updated: "Today" },
  { id: "i2", name: "Product hero render.png", kind: "image", folder: "home", size: "2.7 MB", updated: "Yesterday" },
  { id: "i3", name: "Logo on white.svg", kind: "image", folder: "starred", size: "12 KB", updated: "Last week" },
  { id: "i4", name: "Brand voice one-pager.pdf", kind: "pdf", folder: "starred", size: "298 KB", updated: "3 weeks ago" },
  { id: "i5", name: "Promo video.mp4", kind: "video", folder: "home", size: "112 MB", updated: "2 days ago" },
  { id: "i6", name: "Studio reel.mp4", kind: "video", folder: "shared", size: "78 MB", updated: "Last week" },
  { id: "i7", name: "Studio session raw.mp3", kind: "audio", folder: "shared", size: "42 MB", updated: "Last month" },
  { id: "i8", name: "Press kit.docx", kind: "doc", folder: "files", size: "86 KB", updated: "Last month" },
  { id: "i9", name: "Spring lifestyle 1.png", kind: "image", folder: "files", size: "1.8 MB", updated: "2 hours ago" },
  { id: "i10", name: "Spring lifestyle 2.png", kind: "image", folder: "files", size: "2.1 MB", updated: "2 hours ago" },
];

const KIND_ICON_BG: Record<FileKind, string> = {
  image: "bg-blue-50 text-blue-600",
  video: "bg-indigo-50 text-indigo-600",
  pdf: "bg-rose-50 text-rose-600",
  doc: "bg-zinc-100 text-zinc-700",
  audio: "bg-violet-50 text-violet-600",
  folder: "bg-blue-50 text-blue-600",
};

const KIND_ICON: Record<FileKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Film,
  pdf: FileText,
  doc: FileIcon,
  audio: Music,
  folder: Folder,
};

const DROPBOX_BLUE = "#0061FF";

export function DropboxDialog({ open, onClose, onImport }: DropboxDialogProps) {
  const [folder, setFolder] = useState<FolderId>("home");
  const [browsePath, setBrowsePath] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function reset() {
    setFolder("home");
    setBrowsePath([]);
    setSearch("");
    setSelected(new Set());
  }
  function handleClose() {
    reset();
    onClose();
  }

  const items = useMemo(() => {
    let list = ITEMS.filter((i) => i.kind === "folder" || i.folder === folder);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [folder, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    const imports: ImportedFile[] = ITEMS.filter((i) => selected.has(i.id) && i.kind !== "folder").map((i) => ({
      url: `https://picsum.photos/seed/${i.id}/1200/1200`,
      name: i.name,
      mimeType:
        i.kind === "video" ? "video/mp4" :
        i.kind === "pdf" ? "application/pdf" :
        i.kind === "audio" ? "audio/mpeg" :
        i.kind === "doc" ? "application/msword" :
        "image/jpeg",
    }));
    onImport(imports);
    reset();
    onClose();
  }

  const selectedCount = Array.from(selected).filter((id) => ITEMS.find((i) => i.id === id)?.kind !== "folder").length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <DropboxLogo />
          <span>Import from Dropbox</span>
        </div>
      }
      description={`${selectedCount} file${selectedCount === 1 ? "" : "s"} selected`}
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
            disabled={selectedCount === 0}
            onClick={handleImport}
            className="inline-flex items-center justify-center rounded-md text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: DROPBOX_BLUE }}
          >
            Import {selectedCount} File{selectedCount === 1 ? "" : "s"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 min-h-[360px]">
        {/* Sidebar */}
        <div className="space-y-1 border border-zinc-200 rounded-md p-2 bg-zinc-50/60 h-fit">
          <p className="px-2 pt-1 pb-1.5 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Workspace</p>
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const active = folder === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFolder(f.id);
                  setBrowsePath([]);
                }}
                className={cn(
                  "w-full inline-flex items-center gap-2 rounded px-2 h-8 text-xs font-medium transition-colors text-left",
                  active ? "bg-blue-50" : "hover:bg-zinc-100"
                )}
                style={active ? { color: DROPBOX_BLUE } : { color: "#3f3f46" }}
              >
                <Icon className={cn("size-3.5", active ? "" : "text-zinc-500")} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Right pane */}
        <div className="space-y-3 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 flex-wrap">
            <button
              type="button"
              onClick={() => setBrowsePath([])}
              className="hover:text-zinc-900 font-medium"
            >
              {FOLDERS.find((f) => f.id === folder)?.label ?? "Home"}
            </button>
            {browsePath.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <ChevronRight className="size-3" />
                <span className="text-zinc-900">{p}</span>
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in Dropbox…"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>

          {/* Grid */}
          <div className="border border-zinc-200 rounded-md max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-500">
                <Folder className="size-8 text-zinc-300 mb-2" />
                <p className="text-sm">Nothing here yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((i) => {
                  const Icon = KIND_ICON[i.kind];
                  const isSel = selected.has(i.id);
                  const isFolder = i.kind === "folder";
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isFolder) {
                            setBrowsePath((p) => [...p, i.name]);
                            return;
                          }
                          toggle(i.id);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          isFolder ? "hover:bg-zinc-50 cursor-pointer" : isSel ? "bg-blue-50" : "hover:bg-zinc-50"
                        )}
                      >
                        <span
                          className={cn(
                            "size-9 inline-flex items-center justify-center rounded-md shrink-0",
                            KIND_ICON_BG[i.kind]
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSel && !isFolder ? "" : "text-zinc-900")} style={isSel && !isFolder ? { color: DROPBOX_BLUE } : undefined}>{i.name}</p>
                          {!isFolder ? (
                            <p className="text-[10px] text-zinc-500">{i.size} · {i.updated}</p>
                          ) : null}
                        </div>
                        {isFolder ? (
                          <ChevronRight className="size-4 text-zinc-400" />
                        ) : isSel ? (
                          <span className="size-5 rounded-full text-white text-xs flex items-center justify-center" style={{ backgroundColor: DROPBOX_BLUE }}>✓</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DropboxLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
      <path d="M14 6 L24 13 L34 6 L24 0 Z" fill="#0061FF" />
      <path d="M14 24 L24 31 L34 24 L24 18 Z" fill="#0061FF" />
      <path d="M0 16 L10 23 L20 16 L10 9 Z" fill="#0061FF" />
      <path d="M28 16 L38 9 L48 16 L38 23 Z" fill="#0061FF" />
      <path d="M0 34 L10 41 L20 34 L10 27 Z" fill="#0061FF" />
      <path d="M28 34 L38 27 L48 34 L38 41 Z" fill="#0061FF" />
      <path d="M14 42 L24 49 L34 42 L24 35 Z" fill="#0061FF" />
    </svg>
  );
}
