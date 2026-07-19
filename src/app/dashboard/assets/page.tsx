"use client";

import { useState, useRef, useMemo, useEffect, type ReactNode } from "react";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Tag as TagIcon,
  FolderPlus,
  Image as ImageIcon,
  FileVideo,
  FileText,
  ArrowUpDown,
  X,
  Eye,
  Download,
  Trash2,
  Edit3,
  Copy,
  Move,
  Plus,
  ChevronDown,
  Hash,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "all" | "images" | "videos";
type ViewMode = "grid" | "list";
type Sort = "newest" | "oldest" | "name" | "size" | "type";

interface MediaAsset {
  id: string;
  name: string;
  size: number; // bytes
  type: "image" | "video" | "doc";
  folder: string;
  tags: string[];
  uploadedAt: string; // ISO
  thumbnail: string; // url or gradient
  width?: number;
  height?: number;
  duration?: number;
  isVideo?: boolean;
}

interface ApiMediaAsset {
  id: string;
  url: string;
  mime?: string;
  size?: number;
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  uploadedAt?: string;
}

interface PendingFile {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  status: "queued" | "uploading" | "done" | "error";
}

const SAMPLE_ASSETS: MediaAsset[] = [
  {
    id: "a1",
    name: "io-onboarding-intro.mp4",
    size: 18_200_000,
    type: "video",
    folder: "",
    tags: [],
    uploadedAt: "2026-06-23",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=75",
    isVideo: true,
    duration: 30,
  },
  {
    id: "a2",
    name: "caty (2).png",
    size: 104_000,
    type: "image",
    folder: "",
    tags: [],
    uploadedAt: "2026-06-23",
    thumbnail: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=200&q=75",
  },
  {
    id: "a3",
    name: "1782206680392-li2lcxkq7-0.jpg",
    size: 157_900,
    type: "image",
    folder: "",
    tags: [],
    uploadedAt: "2026-06-23",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=75",
  },
  {
    id: "a4",
    name: "ct ct.png",
    size: 157_900,
    type: "image",
    folder: "",
    tags: [],
    uploadedAt: "2026-06-23",
    thumbnail: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=200&q=75",
  },
];

const FOLDERS: string[] = [];

const TAGS: string[] = [];

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function AssetsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>(SAMPLE_ASSETS);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/media-assets", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setLoadingAssets(false);
          return;
        }
        const data = (await res.json()) as { assets?: ApiMediaAsset[] };
        if (cancelled) return;
        const mapped = (data.assets ?? []).map<MediaAsset>((a) => ({
          id: a.id,
          name: a.name ?? a.url?.split("/").pop() ?? "asset",
          size: a.size ?? 0,
          type: a.mime?.startsWith("video/")
            ? "video"
            : a.mime?.startsWith("image/")
            ? "image"
            : "doc",
          folder: "",
          tags: a.tags ?? [],
          uploadedAt: a.uploadedAt ?? new Date().toISOString(),
          thumbnail: a.url,
          width: a.width,
          height: a.height,
          duration: a.duration,
          isVideo: a.mime?.startsWith("video/"),
        }));
        if (mapped.length > 0) setAssets(mapped);
      } catch {
        // offline — keep seed
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build usage map: mediaUrl -> post count, derived from /api/posts so we
  // don't need a dedicated usage endpoint. Source of truth: post.mediaUrls[].
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/posts?pageSize=200", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { posts?: { mediaUrls?: string[] }[] };
        const map: Record<string, number> = {};
        for (const p of data.posts ?? []) {
          for (const url of p.mediaUrls ?? []) {
            if (!url) continue;
            map[url] = (map[url] ?? 0) + 1;
          }
        }
        if (!cancelled) setUsageMap(map);
      } catch {
        /* offline — leave empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ asset: MediaAsset; x: number; y: number } | null>(null);

  // Escape key handler for modals
  useEffect(() => {
    if (!uploadOpen && !newFolderOpen && !tagsOpen && !preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (uploadOpen) { setUploadOpen(false); setPendingFiles([]); }
        else if (newFolderOpen) setNewFolderOpen(false);
        else if (tagsOpen) setTagsOpen(false);
        else if (preview) setPreview(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [uploadOpen, newFolderOpen, tagsOpen, preview]);

  // Upload state
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = assets;
    if (tab === "images") list = list.filter((a) => a.type === "image");
    if (tab === "videos") list = list.filter((a) => a.type === "video");
    if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest": return b.uploadedAt.localeCompare(a.uploadedAt);
        case "oldest": return a.uploadedAt.localeCompare(b.uploadedAt);
        case "name": return a.name.localeCompare(b.name);
        case "size": return b.size - a.size;
        case "type": return a.type.localeCompare(b.type);
      }
    });
    return list;
  }, [tab, search, sort]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };

  // File upload handlers — track both PendingFile id (UI) and the original File object so we
  // can actually PUT the bytes to Bunny when the user clicks "Upload".
  const pendingFileMap = useRef(new Map<string, File>());

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPending: PendingFile[] = [];
    Array.from(files).forEach((f) => {
      const id = Math.random().toString(36).slice(2);
      pendingFileMap.current.set(id, f);
      newPending.push({
        id,
        name: f.name,
        size: f.size,
        progress: 0,
        status: "queued",
      });
    });
    setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const removePending = (id: string) => {
    pendingFileMap.current.delete(id);
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    const toUpload = pendingFiles.filter((p) => p.status === "queued" || p.status === "error");
    if (toUpload.length === 0) return;
    setPendingFiles((prev) =>
      prev.map((f) => (toUpload.some((u) => u.id === f.id) ? { ...f, status: "uploading" as const, progress: 0 } : f))
    );
    await Promise.all(
      toUpload.map(async (pf) => {
        const file = pendingFileMap.current.get(pf.id);
        if (!file) {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "error", progress: 0 } : f))
          );
          return;
        }
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "assets");
          const res = await fetch("/api/media/upload", { method: "POST", body: fd });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            throw new Error(data.error ?? `HTTP ${res.status}`);
          }
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "done", progress: 100 } : f))
          );
          // Refresh asset list from server
          try {
            const refresh = await fetch("/api/media-assets", { credentials: "include" });
            if (refresh.ok) {
              const refreshed = (await refresh.json()) as { assets?: ApiMediaAsset[] };
              const mapped = (refreshed.assets ?? []).map<MediaAsset>((a) => ({
                id: a.id,
                name: a.name ?? a.url?.split("/").pop() ?? "asset",
                size: a.size ?? 0,
                type: a.mime?.startsWith("video/")
                  ? "video"
                  : a.mime?.startsWith("image/")
                  ? "image"
                  : "doc",
                folder: "",
                tags: a.tags ?? [],
                uploadedAt: a.uploadedAt ?? new Date().toISOString(),
                thumbnail: a.url,
                width: a.width,
                height: a.height,
                duration: a.duration,
                isVideo: a.mime?.startsWith("video/"),
              }));
              if (mapped.length > 0) setAssets(mapped);
            }
          } catch {
            // ignore — list will refresh on next manual reload
          }
        } catch {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "error", progress: 0 } : f))
          );
        }
      })
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 p-6 lg:p-8 pt-6 lg:pt-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
            Manage all your media assets and content library. Upload, organize, and reuse your visual content across all your social media platforms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTagsOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white h-9 px-4 text-sm font-medium hover:bg-zinc-50"
          >
            <TagIcon className="size-4" />
            Tags
          </button>
          <button
            type="button"
            onClick={() => setNewFolderOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white h-9 px-4 text-sm font-medium hover:bg-zinc-50"
          >
            <FolderPlus className="size-4" />
            New Folder
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 text-white h-9 px-4 text-sm font-medium hover:bg-zinc-800"
          >
            <Upload className="size-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-md bg-zinc-100 p-0.5">
            {([
              { id: "all", label: "All" },
              { id: "images", label: "Images", Icon: ImageIcon },
              { id: "videos", label: "Videos", Icon: FileVideo },
            ] as { id: Tab; label: string; Icon?: typeof ImageIcon }[]).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 h-8 rounded text-xs font-medium transition-colors",
                  tab === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {t.Icon && <t.Icon className="size-3.5" />}
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-500">{filtered.length} assets</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelected(new Set());
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border h-8 px-3 text-sm font-medium transition-colors",
              selectMode ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
            )}
          >
            {selectMode ? <CheckCircle2 className="size-4" /> : <Sparkles className="size-4" />}
            Select
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white h-8 px-3 text-sm font-medium hover:bg-zinc-50 min-w-[120px]"
            >
              <ArrowUpDown className="size-4" />
              {sortLabel(sort)}
              <ChevronDown className="size-3.5 ml-auto text-zinc-400" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-zinc-200 bg-white shadow-lg z-40 py-1">
                  {([
                    { id: "newest", label: "Newest first" },
                    { id: "oldest", label: "Oldest first" },
                    { id: "name", label: "Name (A-Z)" },
                    { id: "size", label: "Size (largest)" },
                    { id: "type", label: "Type" },
                  ] as { id: Sort; label: string }[]).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSort(s.id); setSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 flex items-center justify-between",
                        sort === s.id && "text-zinc-900 font-medium"
                      )}
                    >
                      {s.label}
                      {sort === s.id && <CheckCircle2 className="size-3.5 text-zinc-900" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors",
                view === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="size-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors",
                view === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
              aria-label="List view"
            >
              <List className="size-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900 text-white px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <button type="button" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium hover:bg-zinc-800">
            <Move className="size-3.5" />
            Move
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium hover:bg-zinc-800">
            <TagIcon className="size-3.5" />
            Tag
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium hover:bg-zinc-800">
            <Download className="size-3.5" />
            Download
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-rose-300 hover:bg-zinc-800">
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Search bar (visible in select mode) */}
      {selectMode && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-8 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      )}

      {/* Main content */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyAssets />
        ) : view === "list" ? (
          <ListView
            assets={filtered}
            selectMode={selectMode}
            selected={selected}
            onToggle={toggleSelect}
            onSelectAll={selectAll}
            onPreview={setPreview}
            onContextMenu={(asset, x, y) => setContextMenu({ asset, x, y })}
            usageMap={usageMap}
          />
        ) : (
          <GridView
            assets={filtered}
            selectMode={selectMode}
            selected={selected}
            onToggle={toggleSelect}
            onPreview={setPreview}
            onContextMenu={(asset, x, y) => setContextMenu({ asset, x, y })}
            usageMap={usageMap}
          />
        )}
      </div>

      {/* Modals */}
      {uploadOpen && (
        <UploadModal
          onClose={() => { setUploadOpen(false); setPendingFiles([]); }}
          pendingFiles={pendingFiles}
          onAddFiles={handleFiles}
          onRemove={removePending}
          onUpload={startUpload}
          inputRef={fileInputRef}
        />
      )}
      {newFolderOpen && (
        <NewFolderModal
          onClose={() => setNewFolderOpen(false)}
          onCreate={(name) => {
            setNewFolderOpen(false);
          }}
        />
      )}
      {tagsOpen && <TagsPanel onClose={() => setTagsOpen(false)} />}
      {preview && <PreviewModal asset={preview} onClose={() => setPreview(null)} />}
      {contextMenu && (
        <ContextMenu
          asset={contextMenu.asset}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onPreview={() => { setPreview(contextMenu.asset); setContextMenu(null); }}
        />
      )}
    </div>
  );
}

function sortLabel(s: Sort): string {
  return { newest: "Newest", oldest: "Oldest", name: "Name", size: "Size", type: "Type" }[s];
}

/* ============================== LIST VIEW ============================== */

function ListView({
  assets, selectMode, selected, onToggle, onSelectAll, onPreview, onContextMenu, usageMap,
}: {
  assets: MediaAsset[];
  selectMode: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onPreview: (a: MediaAsset) => void;
  onContextMenu: (a: MediaAsset, x: number, y: number) => void;
  usageMap: Record<string, number>;
}) {
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_120px_120px_80px_80px_80px_100px_40px] gap-3 px-3 py-2 border-b border-zinc-200 text-xs font-medium text-zinc-500 tracking-wide">
        <div>
          {selectMode && (
            <input
              type="checkbox"
              aria-label="Select all"
              checked={selected.size === assets.length && assets.length > 0}
              onChange={onSelectAll}
              className="size-4 rounded border-zinc-300 accent-zinc-900"
            />
          )}
        </div>
        <div>Name</div>
        <div>Folder</div>
        <div>Tags</div>
        <div>Type</div>
        <div>Size</div>
        <div>Date</div>
        <div>Used in</div>
        <div></div>
      </div>
      {assets.map((a) => (
        <ListRow
          key={a.id}
          asset={a}
          selectMode={selectMode}
          selected={selected.has(a.id)}
          onToggle={() => onToggle(a.id)}
          onPreview={() => onPreview(a)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(a, e.clientX, e.clientY);
          }}
          usageCount={usageMap[a.thumbnail] ?? 0}
        />
      ))}
    </div>
  );
}

function ListRow({
  asset, selectMode, selected, onToggle, onPreview, onContextMenu, usageCount,
}: {
  asset: MediaAsset;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  usageCount: number;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_120px_120px_80px_80px_80px_100px_40px] gap-3 items-center px-3 py-2 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-b-0 transition-colors" onClick={onPreview} onContextMenu={onContextMenu}>
      <div onClick={(e) => e.stopPropagation()}>
        {selectMode ? (
          <input
            type="checkbox"
            aria-label={`Select ${asset.name}`}
            checked={selected}
            onChange={onToggle}
            className="size-4 rounded border-zinc-300 accent-zinc-900"
          />
        ) : (
          <div className="size-10 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
            {asset.isVideo ? (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <Play className="size-3.5 text-white" />
              </div>
            ) : (
              <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{asset.name}</p>
      <p className="text-sm text-zinc-400 truncate">{asset.folder || "—"}</p>
      <p className="text-sm text-zinc-400 truncate">{asset.tags.length === 0 ? "—" : asset.tags.join(", ")}</p>
      <span className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit",
        asset.type === "video" && "bg-zinc-100 text-zinc-700",
        asset.type === "image" && "bg-zinc-100 text-zinc-700",
        asset.type === "doc" && "bg-zinc-100 text-zinc-700"
      )}>
        {capitalize(asset.type)}
      </span>
      <p className="text-sm text-zinc-500">{formatSize(asset.size)}</p>
      <p className="text-sm text-zinc-500">{formatDate(asset.uploadedAt)}</p>
      <p className={cn("text-sm", usageCount > 0 ? "text-zinc-700 font-medium" : "text-zinc-400")}>
        {usageCount === 0 ? "—" : `${usageCount} post${usageCount === 1 ? "" : "s"}`}
      </p>
      <button type="button" onClick={(e) => { e.stopPropagation(); onPreview(); }} className="text-zinc-400 hover:text-zinc-700" aria-label="Open external">
        <ExternalLink className="size-3.5" />
      </button>
    </div>
  );
}

/* ============================== GRID VIEW ============================== */

function GridView({
  assets, selectMode, selected, onToggle, onPreview, onContextMenu, usageMap,
}: {
  assets: MediaAsset[];
  selectMode: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onPreview: (a: MediaAsset) => void;
  onContextMenu: (a: MediaAsset, x: number, y: number) => void;
  usageMap: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3">
      {assets.map((a) => (
        <GridCard
          key={a.id}
          asset={a}
          selectMode={selectMode}
          selected={selected.has(a.id)}
          onToggle={() => onToggle(a.id)}
          onPreview={() => onPreview(a)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(a, e.clientX, e.clientY);
          }}
          usageCount={usageMap[a.thumbnail] ?? 0}
        />
      ))}
    </div>
  );
}

function GridCard({
  asset, selectMode, selected, onToggle, onPreview, onContextMenu, usageCount,
}: {
  asset: MediaAsset;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  usageCount: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow group cursor-pointer transition-all duration-200 hover:shadow-md w-full max-w-full overflow-hidden",
        selected && "ring-2 ring-zinc-900 border-zinc-900"
      )}
      onClick={onPreview}
      onContextMenu={onContextMenu}
    >
      <div className="relative aspect-square bg-zinc-100 overflow-hidden">
        {asset.isVideo ? (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <img src={asset.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                <Play className="size-5 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : (
          <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
        )}
        {selectMode && (
          <div className="absolute top-2 left-2" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            <input
              type="checkbox"
              aria-label={`Select ${asset.name}`}
              checked={selected}
              onChange={onToggle}
              className="size-4 rounded border-white accent-zinc-900"
            />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium truncate">{asset.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
            {capitalize(asset.type)}
          </span>
          <span className="text-[11px] text-zinc-500">{formatSize(asset.size)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-zinc-500">{formatDate(asset.uploadedAt)}</p>
          {usageCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium">
              Used in {usageCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================== UPLOAD MODAL ============================== */

function UploadModal({
  onClose, pendingFiles, onAddFiles, onRemove, onUpload, inputRef,
}: {
  onClose: () => void;
  pendingFiles: PendingFile[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  onUpload: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in-0" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Upload Media</h2>
            <p className="text-sm text-zinc-500 mt-1">Upload images, videos, or documents to your media library.</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 pb-5">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
              dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 hover:border-zinc-900"
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onAddFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
            />
            <Upload className="size-8 text-zinc-400 mb-3" />
            <p className="text-sm font-medium text-zinc-700">Drag & drop files here</p>
            <p className="text-xs text-zinc-500 mt-1">or click to browse</p>
            <p className="text-[11px] text-zinc-400 mt-3">JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, PDF</p>
          </div>

          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {pendingFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2 rounded-md border border-zinc-200">
                  <div className="size-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                    <ImageIcon className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-500">{formatSize(f.size)}</p>
                      {f.status === "uploading" && (
                        <div className="flex-1 max-w-[120px] h-1 rounded-full bg-zinc-100 overflow-hidden">
                          <div className="h-full bg-zinc-900 transition-all" style={{ width: `${f.progress}%` }} />
                        </div>
                      )}
                      {f.status === "done" && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => onRemove(f.id)} className="text-zinc-400 hover:text-zinc-700" aria-label="Remove">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
              <span className="text-sm text-zinc-500">{pendingFiles.length} files selected</span>
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
              >
                Upload {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== NEW FOLDER MODAL ============================== */

function NewFolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in-0" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3">
          <h2 className="text-lg font-semibold text-zinc-900">Create Folder</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 pb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCreate(name.trim())}
              disabled={!name.trim()}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-300 text-white text-sm font-medium disabled:opacity-60"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== TAGS PANEL ============================== */

const LOCAL_TAGS_KEY = "postplanify_local_tags";

function loadLocalTags(): { name: string; assets: number }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TAGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalTags(tags: { name: string; assets: number }[]) {
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(tags));
}

function TagsPanel({ onClose }: { onClose: () => void }) {
  const [tags, setTags] = useState<{ name: string; assets: number }[]>(loadLocalTags);
  const [input, setInput] = useState("");

  const filtered = useMemo(
    () =>
      input
        ? tags.filter((t) => t.name.toLowerCase().includes(input.toLowerCase()))
        : tags,
    [tags, input]
  );

  function handleAdd() {
    const name = input.trim();
    if (!name) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    const next = [...tags, { name, assets: 0 }];
    setTags(next);
    saveLocalTags(next);
    setInput("");
  }

  function handleRemove(name: string) {
    const next = tags.filter((t) => t.name !== name);
    setTags(next);
    saveLocalTags(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in-0" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-sm bg-white shadow-xl h-full flex flex-col animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <TagIcon className="size-4" />
            Tags
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Search or create tag..."
              className="flex-1 h-9 px-3 rounded-md border border-zinc-200 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!input.trim()}
              className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-zinc-900 text-white text-sm font-medium disabled:opacity-50"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center text-zinc-400 text-center px-6 py-12">
              <TagIcon className="size-10 text-zinc-300 mb-2" />
              <p className="text-sm font-medium text-zinc-700">
                {input ? "No matching tags" : "Tag management coming soon"}
              </p>
            </div>
          )}
          {filtered.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-50 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TagIcon className="size-3.5 text-zinc-400 shrink-0" />
                <span className="text-sm text-zinc-800 truncate">{tag.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-400 tabular-nums">{tag.assets} asset{tag.assets !== 1 ? "s" : ""}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(tag.name)}
                  className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${tag.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== PREVIEW MODAL ============================== */

function PreviewModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in-0" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 bg-zinc-900 flex items-center justify-center min-h-[300px]">
          {asset.isVideo ? (
            <video src={asset.thumbnail} controls className="max-w-full max-h-[80vh]" />
          ) : (
            <img src={asset.thumbnail} alt={asset.name} className="max-w-full max-h-[80vh] object-contain" />
          )}
        </div>
        <div className="w-full md:w-80 p-5 border-l border-zinc-200 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate flex-1">{asset.name}</h3>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Type" value={capitalize(asset.type)} />
            <Row label="Size" value={formatSize(asset.size)} />
            <Row label="Uploaded" value={formatDate(asset.uploadedAt)} />
            {asset.folder && <Row label="Folder" value={asset.folder} />}
            {asset.tags.length > 0 && <Row label="Tags" value={asset.tags.join(", ")} />}
            {asset.duration && <Row label="Duration" value={`${asset.duration}s`} />}
          </div>
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button type="button" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50">
              <Download className="size-3.5" />
              Download
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50">
              <Edit3 className="size-3.5" />
              Rename
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50">
              <Copy className="size-3.5" />
              Replace
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-rose-200 bg-white text-rose-600 text-sm font-medium hover:bg-rose-50">
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900 truncate ml-2">{value}</span>
    </div>
  );
}

/* ============================== CONTEXT MENU ============================== */

function ContextMenu({ asset, x, y, onClose, onPreview }: { asset: MediaAsset; x: number; y: number; onClose: () => void; onPreview: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-48 rounded-md border border-zinc-200 bg-white shadow-lg py-1"
        style={{ left: x, top: y }}
      >
        <MenuItem icon={Eye} label="Preview" onClick={onPreview} />
        <MenuItem icon={Download} label="Download" onClick={onClose} />
        <MenuItem icon={Copy} label="Copy link" onClick={onClose} />
        <MenuItem icon={Move} label="Move to folder" onClick={onClose} />
        <MenuItem icon={TagIcon} label="Add tag" onClick={onClose} />
        <MenuItem icon={Edit3} label="Rename" onClick={onClose} />
        <div className="my-1 border-t border-zinc-100" />
        <MenuItem icon={Trash2} label="Delete" onClick={onClose} danger />
      </div>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-zinc-50",
        danger ? "text-rose-600" : "text-zinc-700"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

/* ============================== EMPTY STATE ============================== */

function EmptyAssets() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <ImageIcon className="size-6 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-900">No assets found</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">Upload your first image, video, or document to get started.</p>
      <button type="button" className="inline-flex items-center gap-1.5 mt-4 h-9 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800">
        <Upload className="size-4" />
        Upload
      </button>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}