"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronRight,
  Folder,
  HardDrive,
  Users,
  Star,
  Clock,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ImportedFile } from "./canva-dialog";

interface GoogleDriveDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: ImportedFile[]) => void;
}

type FolderId = "my-drive" | "shared" | "starred" | "recent";
type FileKind = "folder" | "image" | "video" | "pdf" | "doc" | "audio";

interface DriveItem {
  id: string;
  name: string;
  kind: FileKind;
  folder: FolderId;
  size?: string;
  updated?: string;
}

const FOLDERS: { id: FolderId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "my-drive", label: "My Drive", icon: HardDrive },
  { id: "shared", label: "Shared with me", icon: Users },
  { id: "starred", label: "Starred", icon: Star },
  { id: "recent", label: "Recent", icon: Clock },
];

const ITEMS: DriveItem[] = [
  { id: "f1", name: "Marketing assets", kind: "folder", folder: "my-drive" },
  { id: "f2", name: "Q3 launches", kind: "folder", folder: "my-drive" },
  { id: "f3", name: "Customer logos", kind: "folder", folder: "my-drive" },
  { id: "f4", name: "Team shared", kind: "folder", folder: "shared" },
  { id: "f5", name: "Brand guidelines", kind: "folder", folder: "starred" },
  { id: "i1", name: "Hero shot.jpg", kind: "image", folder: "my-drive", size: "2.4 MB", updated: "Today" },
  { id: "i2", name: "Q3 hero dark.png", kind: "image", folder: "my-drive", size: "1.8 MB", updated: "Yesterday" },
  { id: "i3", name: "Team photo — kitchen.jpg", kind: "image", folder: "shared", size: "5.1 MB", updated: "2 days ago" },
  { id: "i4", name: "Product launch reel.mp4", kind: "video", folder: "my-drive", size: "84 MB", updated: "Last week" },
  { id: "i5", name: "Brand colors.pdf", kind: "pdf", folder: "starred", size: "412 KB", updated: "3 weeks ago" },
  { id: "i6", name: "Logo lockup.svg", kind: "image", folder: "starred", size: "8 KB", updated: "Last month" },
  { id: "i7", name: "Customer story — Anna.docx", kind: "doc", folder: "shared", size: "48 KB", updated: "Last month" },
  { id: "i8", name: "Highlight reel.mp4", kind: "video", folder: "recent", size: "62 MB", updated: "Yesterday" },
  { id: "i9", name: "Coffee shop ambient.mp3", kind: "audio", folder: "my-drive", size: "5.2 MB", updated: "2 weeks ago" },
  { id: "i10", name: "Spring banner.png", kind: "image", folder: "recent", size: "1.1 MB", updated: "2 hours ago" },
];

const KIND_ICON_BG: Record<FileKind, string> = {
  image: "bg-blue-50 text-blue-600",
  video: "bg-red-50 text-red-600",
  pdf: "bg-red-50 text-red-600",
  doc: "bg-blue-50 text-blue-600",
  audio: "bg-amber-50 text-amber-600",
  folder: "bg-zinc-100 text-zinc-500",
};

const KIND_ICON: Record<FileKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Film,
  pdf: FileText,
  doc: FileText,
  audio: Music,
  folder: Folder,
};

export function GoogleDriveDialog({ open, onClose, onImport }: GoogleDriveDialogProps) {
  const [folder, setFolder] = useState<FolderId>("my-drive");
  const [browsePath, setBrowsePath] = useState<string[]>([]); // currently opened folders
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function reset() {
    setFolder("my-drive");
    setBrowsePath([]);
    setSearch("");
    setSelected(new Set());
  }
  function handleClose() {
    reset();
    onClose();
  }

  // Items inside the current folder (or filtered by sidebar folder)
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
    const imports: ImportedFile[] = ITEMS.filter((i) => selected.has(i.id) && i.kind !== "folder").map((i) => {
      // Use picsum for images (CORS-safe placeholder) — non-images keep their kind label
      const isImage = i.kind === "image";
      const url = isImage ? `https://picsum.photos/seed/${i.id}/1200/1200` : `https://picsum.photos/seed/${i.id}/1200/1200`;
      const ext = i.name.split(".").pop() ?? "bin";
      return {
        url,
        name: i.name,
        mimeType: i.kind === "video" ? "video/mp4" : i.kind === "pdf" ? "application/pdf" : i.kind === "audio" ? "audio/mpeg" : "image/jpeg",
      };
    });
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
          <DriveLogo />
          <span>Import from Google Drive</span>
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
            style={{ backgroundColor: "#1A73E8" }}
          >
            Import {selectedCount} File{selectedCount === 1 ? "" : "s"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 min-h-[360px]">
        {/* Sidebar */}
        <div className="space-y-1 border border-zinc-200 rounded-md p-2 bg-zinc-50/60 h-fit">
          <p className="px-2 pt-1 pb-1.5 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Locations</p>
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
                  active ? "bg-blue-50 text-blue-700" : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <Icon className={cn("size-3.5", active ? "text-blue-600" : "text-zinc-500")} />
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
              {FOLDERS.find((f) => f.id === folder)?.label ?? "My Drive"}
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
              placeholder="Search in Drive…"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>

          {/* List */}
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
                            isFolder ? "bg-white border border-zinc-200 text-zinc-500" : KIND_ICON_BG[i.kind]
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSel && !isFolder ? "text-blue-700" : "text-zinc-900")}>{i.name}</p>
                          {!isFolder ? (
                            <p className="text-[10px] text-zinc-500">{i.size} · {i.updated}</p>
                          ) : null}
                        </div>
                        {isFolder ? (
                          <ChevronRight className="size-4 text-zinc-400" />
                        ) : isSel ? (
                          <span className="size-5 rounded-full text-white text-xs flex items-center justify-center" style={{ backgroundColor: "#1A73E8" }}>✓</span>
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

function DriveLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
      <path d="M15.6 7.4l-9 15.6 6.5 0 9-15.6z" fill="#0066DA" />
      <path d="M32.4 7.4l-9 15.6 6.5 0 9-15.6z" fill="#00AC47" />
      <path d="M9 27l6.5 11.3 6.5-11.3z" fill="#EA4335" />
      <path d="M22 27l6.5 11.3 6.5-11.3z" fill="#00832D" />
      <path d="M15.6 7.4L24 23l6.5-11.3z" fill="#008329" />
    </svg>
  );
}
