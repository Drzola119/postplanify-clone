"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import {
  Eye,
  Check,
  Settings,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Upload,
  Type,
  Sparkles,
  RotateCcw,
  Send,
  Hash,
  Info,
  Crop,
  FileText,
  AtSign,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";
import { loadDraft, saveDraft, newDraftId, type DraftRecord } from "@/lib/drafts";
import { StepCircle } from "@/components/dashboard/step-circle";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { AccountPreviewCard } from "@/components/dashboard/account-preview-card";
import { AICaptionsDialog } from "@/components/dashboard/ai-captions-dialog";
import { UnsplashDialog } from "@/components/dashboard/unsplash-dialog";
import { CanvaDialog, type ImportedFile } from "@/components/dashboard/canva-dialog";
import { GoogleDriveDialog } from "@/components/dashboard/google-drive-dialog";
import { DropboxDialog } from "@/components/dashboard/dropbox-dialog";
import { CoverImageModal } from "@/components/dashboard/cover-image-modal";
import { CollaboratorsModal } from "@/components/dashboard/collaborators-modal";
import { TagUsersInput } from "@/components/dashboard/tag-users-input";
import { ScheduleModal } from "@/components/dashboard/schedule-modal";
import { HashtagsDropdown } from "@/components/dashboard/hashtags-dropdown";
import { PlatformTileBar } from "@/components/dashboard/platform-tile-bar";
import { CropModal } from "@/components/dashboard/crop-modal";
import { AltTextModal } from "@/components/dashboard/alt-text-modal";

type MediaTab = "media" | "paste";
type MediaItem = {
  id: string;
  /** Local object URL for preview. Revoked on remove. */
  url: string;
  /** Bunny CDN url — only present after upload completes. */
  cdnUrl?: string;
  /** Path returned from /api/media/upload, used by /api/media/delete. */
  storedPath?: string;
  name: string;
  size: number;
  width: number;
  height: number;
  kind: "image" | "video";
  /** Per-file upload status (so the UI can show pending / failed without breaking preview). */
  uploadStatus: "uploading" | "ready" | "error";
  uploadError?: string;
};

const MEDIA_TABS: { id: MediaTab; label: string }[] = [
  { id: "media", label: "Media" },
  { id: "paste", label: "Paste" },
];

const MAX_FILES = 10;

// Headers are sourced from the centralized client-overrides helper. In
// production they resolve to {} so dev-only secrets never leave the server
// env (see src/lib/security/server-config.ts).

export default function CreatePostPage() {
  const { toast, dismiss } = useToast();

  // Detect ?draft=<id> from /dashboard/posts/drafts → Continue button.
  // Restore the full draft state (media metadata, per-platform captions, accounts,
  // collaborators, hashtags, etc.) so the user picks up where they left off.
  const [draftId, setDraftId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("draft");
    if (!id) return;
    const record = loadDraft(id);
    if (record) {
      setDraftId(id);
      setCaptions(record.captions ?? {});
      setSameForAll(Boolean(record.sameForAll));
      setCommunity(record.community ?? "profile");
      setQuoteTweet(record.quoteTweet ?? "");
      setTagUsers(record.tagUsers ?? "");
      if (record.selected?.length) setSelected(new Set(record.selected));
      setCollaborators(record.collaborators ?? []);
      setCustomCoverUrl(record.customCoverUrl ?? null);
      setFrameCoverUrl(record.frameCoverUrl ?? null);
      // Restore media items that have remote URLs (cdn/remote). Local object URLs
      // cannot survive a page reload, so items without one are dropped with a hint.
      const restoredMedia: MediaItem[] = [];
      let droppedLocal = 0;
      (record.mediaItems ?? []).forEach((m, i) => {
        const remote = m.cdnUrl ?? m.remoteUrl;
        if (!remote) { droppedLocal++; return; }
        restoredMedia.push({
          id: m.localId ?? `restored-${i}-${Date.now()}`,
          url: remote,
          cdnUrl: m.cdnUrl,
          name: m.name ?? "restored",
          size: 0,
          width: 0,
          height: 0,
          kind: m.kind,
          uploadStatus: "ready",
        });
      });
      if (restoredMedia.length > 0) {
        setMediaItems(restoredMedia);
        setActiveMedia(Math.min(record.activeMedia ?? 0, restoredMedia.length - 1));
      }
      toast({
        title: "Draft restored",
        description: droppedLocal > 0
          ? `${droppedLocal} local-only file${droppedLocal === 1 ? "" : "s"} dropped (re-upload to include)`
          : "All fields loaded",
        tone: "info",
      });
    } else {
      toast({ title: `Draft not found (${id})`, tone: "error" });
    }
    // Strip ?draft= from the URL so a refresh doesn't re-fire the restore.
    params.delete("draft");
    const next = params.toString();
    const clean = window.location.pathname + (next ? `?${next}` : "");
    window.history.replaceState({}, "", clean);
  }, [toast]);

  // Account selection (default: ALL platforms — matches production postplanify.com where every platform is selected on first visit).
  const [selected, setSelected] = useState<Set<PlatformId>>(
    () => new Set(PLATFORMS.map((p) => p.id))
  );
  const [remember, setRemember] = useState(true);
  const [feedType, setFeedType] = useState<"feed" | "story">("feed");

  // Per-account captions
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [sameForAll, setSameForAll] = useState(false);

  // Community + quote tweet (X-specific)
  const [community, setCommunity] = useState("profile");
  const [quoteTweet, setQuoteTweet] = useState("");

  // Tag Users (shown when media uploaded)
  const [tagUsers, setTagUsers] = useState("");

  // Dialogs
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [collaboratorsModalOpen, setCollaboratorsModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [altTextModalOpen, setAltTextModalOpen] = useState(false);
  const [tagUsersModalOpen, setTagUsersModalOpen] = useState(false);

  // Video cover features
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [frameCoverUrl, setFrameCoverUrl] = useState<string | null>(null);
  const customCoverInputRef = useRef<HTMLInputElement>(null);

  // Collaborators (Instagram only)
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Media
  const [mediaTab, setMediaTab] = useState<MediaTab>("media");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMedia, setActiveMedia] = useState(0);
  const [zoom, setZoom] = useState(300);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set true while the publish API call is in flight.
  const [submitting, setSubmitting] = useState(false);

  const selectedPlatforms = useMemo(
    () => PLATFORMS.filter((p) => selected.has(p.id)),
    [selected]
  );

  const onlyImage = mediaItems.length > 0 && mediaItems.every((m) => m.kind === "image");
  const hasVideo = mediaItems.some((m) => m.kind === "video");
  const activeMediaItem = mediaItems[activeMedia];
  const isVideoActive = activeMediaItem?.kind === "video";

  function toggleAccount(id: PlatformId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(PLATFORMS.map((p) => p.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function startOver() {
    // Revoke any leftover object URLs to avoid memory leaks.
    for (const m of mediaItems) if (m.url) URL.revokeObjectURL(m.url);
    setSelected(new Set());
    setCaptions({});
    setSameForAll(false);
    setMediaItems([]);
    setActiveMedia(0);
    setZoom(300);
    setCustomCoverUrl(null);
    setFrameCoverUrl(null);
    setCollaborators([]);
    setTagUsers("");
    setQuoteTweet("");
    setCommunity("profile");
    setDraftId(null);
    toast({ title: "Reset", description: "Composer cleared", tone: "info" });
  }

  function handleSaveDraft() {
    const id = draftId ?? newDraftId();
    const record: DraftRecord = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      captions,
      sameForAll,
      community,
      quoteTweet,
      tagUsers,
      selected: Array.from(selected),
      collaborators,
      mediaItems: mediaItems.map((m) => ({
        kind: m.kind,
        cdnUrl: m.cdnUrl,
        // cdnUrl present means uploaded and persistable; otherwise it's a local object URL.
        // We do NOT persist blob/object URLs.
        remoteUrl: m.cdnUrl ? undefined : undefined,
        localId: m.id,
        name: m.name,
        mime: m.kind === "video" ? "video/*" : "image/*",
      })),
      activeMedia,
      customCoverUrl,
      frameCoverUrl,
    };
    saveDraft(record);
    setDraftId(id);
    toast({
      title: "Draft saved",
      description: mediaItems.length > 0
        ? `${mediaItems.length} file${mediaItems.length === 1 ? "" : "s"} • ${selected.size} platform${selected.size === 1 ? "" : "s"}`
        : `${selected.size} platform${selected.size === 1 ? "" : "s"} • captions preserved`,
      tone: "success",
    });
  }

  function captionForCurrent(): string {
    const cap = sameForAll
      ? (captions.__all ?? "")
      : (captions[Array.from(selected)[0] ?? PLATFORMS[0].id] ?? "");
    return cap.trim();
  }

  async function publishPost(scheduledAt: Date | null) {
    const platforms = Array.from(selected);
    if (platforms.length === 0) {
      toast({ title: "Pick at least one account", tone: "warning" });
      return;
    }
    const caption = captionForCurrent();
    if (!caption) {
      toast({ title: "Caption is empty", tone: "warning" });
      return;
    }
    const readyMedia = mediaItems.filter((m) => m.cdnUrl);
    if (readyMedia.length === 0) {
      toast({ title: "Upload at least one media file", tone: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getOverrideHeaders()
        },
        body: JSON.stringify({
          platforms,
          caption,
          mediaUrls: readyMedia.map((m) => m.cdnUrl),
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        jobId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast({
          title: scheduledAt ? "Schedule failed" : "Publish failed",
          description: data.error ?? `HTTP ${res.status}`,
          tone: "error",
        });
        return;
      }
      toast({
        title: scheduledAt ? "Post scheduled" : "Post published",
        description: scheduledAt
          ? scheduledAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
          : `Job ${data.jobId?.slice(0, 8)} sent to workflow`,
        tone: "success",
      });
      if (!scheduledAt) startOver();
    } catch (err) {
      toast({
        title: scheduledAt ? "Schedule failed" : "Publish failed",
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExternalImport(items: ImportedFile[]) {
    if (items.length === 0) return;
    toast({
      title: `Importing ${items.length} file${items.length > 1 ? "s" : ""}…`,
      tone: "info",
    });
    const fetched: File[] = [];
    const failures: string[] = [];
    await Promise.all(
      items.map(async (item) => {
        try {
          const res = await fetch(item.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const mime = item.mimeType || blob.type || "image/jpeg";
          fetched.push(new File([blob], item.name, { type: mime }));
        } catch (err) {
          failures.push(item.name);
        }
      })
    );
    if (failures.length > 0) {
      toast({
        title: `${failures.length} import${failures.length === 1 ? "" : "s"} failed`,
        description: failures.slice(0, 3).join(", ") + (failures.length > 3 ? "…" : ""),
        tone: "warning",
      });
    }
    if (fetched.length > 0) await handleFiles(fetched);
  }

  async function handleFiles(files: File[]) {
    const remaining = Math.max(0, MAX_FILES - mediaItems.length);
    const accepted = files.slice(0, remaining);
    const built: { item: MediaItem; file: File }[] = [];
    for (const file of accepted) {
      const localUrl = URL.createObjectURL(file);
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      let width = 0;
      let height = 0;
      if (kind === "image") {
        const dims = await readImageSize(localUrl);
        width = dims.w;
        height = dims.h;
      }
      built.push({
        file,
        item: {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: localUrl,
          name: file.name,
          size: file.size,
          width,
          height,
          kind,
          uploadStatus: "uploading",
        },
      });
    }
    if (built.length === 0) return;
    const newItems = built.map((b) => b.item);
    setMediaItems((prev) => {
      const next = [...prev, ...newItems];
      setActiveMedia(next.length - newItems.length);
      return next;
    });
    toast({
      title: `${newItems.length} file${newItems.length > 1 ? "s" : ""} added`,
      description: "Uploading to Bunny CDN…",
      tone: "info",
    });

    // Fire uploads in parallel; each one mutates its own item in state by id.
    await Promise.all(
      built.map(async ({ item, file }) => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "posts");
          const res = await fetch("/api/media/upload", { 
            method: "POST", 
            body: fd,
            headers: getOverrideHeaders(),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            url?: string;
            storedPath?: string;
            error?: string;
          };
          if (!res.ok || !data.ok || !data.url || !data.storedPath) {
            throw new Error(data.error ?? `HTTP ${res.status}`);
          }
          setMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? { ...m, cdnUrl: data.url, storedPath: data.storedPath, uploadStatus: "ready" as const }
                : m
            )
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? { ...m, uploadStatus: "error" as const, uploadError: msg }
                : m
            )
          );
        }
      })
    );
  }

  function removeMedia(id: string) {
    const target = mediaItems.find((m) => m.id === id);
    if (target?.url) URL.revokeObjectURL(target.url);
    if (target?.storedPath) {
      // Fire-and-forget delete on Bunny. If it fails we still drop the row locally —
      // an orphan in the user's storage folder isn't harmful.
      void fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storedPath: target.storedPath }),
      }).catch(() => {});
    }
    setMediaItems((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const next = prev.filter((m) => m.id !== id);
      if (idx <= activeMedia && activeMedia > 0) setActiveMedia(activeMedia - 1);
      else if (activeMedia >= next.length) setActiveMedia(Math.max(0, next.length - 1));
      return next;
    });
  }

  async function handleGenerateCaptions(opts: {
    tone: string;
    includeHashtags: boolean;
    useEmojis: boolean;
    extra: string;
  }) {
    const active = mediaItems[activeMedia];
    if (!active) {
      toast({ title: "Upload an image or video first", tone: "warning" });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: "Pick at least one account", tone: "warning" });
      return;
    }

    let imageUrl: string | null = null;
    if (active.kind === "image") {
      const rawUrl = active.cdnUrl || active.url;
      if (rawUrl.startsWith("blob:")) {
        // Convert blob URL to base64 data URI so Groq can read it
        try {
          const response = await fetch(rawUrl);
          const blob = await response.blob();
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          toast({ title: "Could not read image for AI analysis", tone: "error" });
          return;
        }
      } else {
        imageUrl = rawUrl;
      }
    }

    const videoTitle =
      active.kind === "video"
        ? active.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
        : null;
    if (!imageUrl && !videoTitle) {
      toast({ title: "Upload an image or video first", tone: "warning" });
      return;
    }

    setAiGenerating(true);
    const tid = toast({
      title: "Generating captions…",
      description: imageUrl ? "Analyzing image with Groq vision model" : "Drafting from video title",
      tone: "info",
    });
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: opts.tone,
          includeHashtags: opts.includeHashtags,
          useEmojis: opts.useEmojis,
          extra: opts.extra,
          imageUrl,
          videoTitle,
          platforms: selectedPlatforms.map((p) => ({
            id: p.id,
            name: p.name,
            charLimit: p.charLimit,
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        caption?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.caption) {
        toast({
          title: "Caption generation failed",
          description: data.error ?? `HTTP ${res.status}`,
          tone: "error",
        });
        return;
      }
      const caption = data.caption.trim();
      if (sameForAll) {
        setCaptions((prev) => ({ ...prev, __all: caption }));
      } else {
        setCaptions((prev) => {
          const next = { ...prev };
          for (const p of selectedPlatforms) next[p.id] = caption;
          return next;
        });
      }
      toast({
        title: "Captions generated",
        description: `Applied to ${selectedPlatforms.length} account${selectedPlatforms.length === 1 ? "" : "s"}`,
        tone: "success",
      });
      setAiDialogOpen(false);
    } catch (err) {
      toast({
        title: "Caption generation failed",
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
    } finally {
      setAiGenerating(false);
      if (tid) dismiss(tid);
    }
  }

  function captionFor(id: PlatformId): string {
    if (sameForAll) return captions.__all ?? "";
    return captions[id] ?? "";
  }

  function setCaptionFor(id: PlatformId, v: string) {
    setCaptions((prev) => ({ ...prev, [sameForAll ? "__all" : id]: v }));
  }

  function handleSameForAllChange(next: boolean) {
    setCaptions((prev) => {
      if (next) {
        const seed = prev.__all ?? prev[selectedPlatforms[0]?.id] ?? "";
        return { ...prev, __all: seed };
      }
      const shared = prev.__all ?? "";
      const nextState: Record<string, string> = { ...prev };
      delete nextState.__all;
      if (shared.length > 0) {
        for (const p of selectedPlatforms) nextState[p.id] = shared;
      }
      return nextState;
    });
    setSameForAll(next);
  }

  const hasAnyContent =
    mediaItems.length > 0 ||
    Object.values(captions).some((v) => v.trim().length > 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">Create New Post</h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <PlatformTileBar
            selected={selected}
            onToggle={toggleAccount}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            getPreviewProps={(id) => {
              const active = mediaItems[activeMedia];
              const mediaUrl = active ? active.cdnUrl ?? active.url : null;
              return {
                caption: captionFor(id),
                mediaUrl,
                mediaKind: active?.kind ?? null,
              };
            }}
          />
          <button
            type="button"
            onClick={startOver}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 h-9 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="size-3.5" />
            Start Over
          </button>
        </div>
      </div>

      {/* 2-column layout: left (Media + Accounts + Cover) | right (Captions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column: Media (top) + Accounts (bottom) + CoverSections (when video) */}
        <div className="space-y-4">
          <MediaCard
            tab={mediaTab}
            onTabChange={setMediaTab}
            items={mediaItems}
            activeIndex={activeMedia}
            onActiveChange={setActiveMedia}
            onFiles={handleFiles}
            onRemove={removeMedia}
            onPickFiles={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onOpenUnsplash={() => setUnsplashOpen(true)}
            onOpenGenerateAI={() => setAiDialogOpen(true)}
            onOpenCanva={() => setCanvaOpen(true)}
            onOpenDrive={() => setDriveOpen(true)}
            onOpenDropbox={() => setDropboxOpen(true)}
            zoom={zoom}
            onZoomChange={setZoom}
            collaboratorsCount={collaborators.length}
            onOpenCollaborators={() => setCollaboratorsModalOpen(true)}
            onOpenCrop={() => setCropModalOpen(true)}
            onOpenAltText={() => setAltTextModalOpen(true)}
            onOpenTagUsers={() => setTagUsersModalOpen(true)}
            customCoverUrl={customCoverUrl}
            frameCoverUrl={frameCoverUrl}
            onOpenCoverModal={() => setCoverModalOpen(true)}
            onPickCustomCover={() => customCoverInputRef.current?.click()}
            onRemoveCustomCover={() => {
              setCustomCoverUrl(null);
              toast({ title: "Custom cover removed", tone: "info" });
            }}
          />

          <AccountsCard
            selected={selected}
            onToggle={toggleAccount}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            remember={remember}
            onRememberChange={setRemember}
            feedType={feedType}
            onFeedTypeChange={setFeedType}
            onlyImage={onlyImage}
          />

          {isVideoActive ? (
            <CoverSections
              frameCoverUrl={frameCoverUrl}
              customCoverUrl={customCoverUrl}
              onOpenFrameModal={() => setCoverModalOpen(true)}
              onPickCustomCover={() => customCoverInputRef.current?.click()}
              onRemoveCustomCover={() => {
                setCustomCoverUrl(null);
                toast({ title: "Custom cover removed", tone: "info" });
              }}
            />
          ) : null}
        </div>

        {/* Right column: Captions */}
        <CaptionsCard
          platforms={selectedPlatforms}
          sameForAll={sameForAll}
          onSameForAllChange={handleSameForAllChange}
          getCaption={captionFor}
          setCaption={setCaptionFor}
          onGenerate={() => setAiDialogOpen(true)}
          community={community}
          onCommunityChange={setCommunity}
          quoteTweet={quoteTweet}
          onQuoteTweetChange={setQuoteTweet}
          tagUsers={tagUsers}
          onTagUsersChange={setTagUsers}
          showTagUsers={mediaItems.length > 0}
          hasVideo={hasVideo}
          toast={toast}
        />
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 w-full bg-background border-t mt-8 -mx-6 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <button
            type="button"
            disabled={!hasAnyContent}
            onClick={handleSaveDraft}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              disabled={!hasAnyContent || submitting}
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </button>
            <button
              type="button"
              disabled={!hasAnyContent || submitting}
              onClick={() => publishPost(null)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-3.5" />
              {submitting ? "Publishing…" : "Publish Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AICaptionsDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        onGenerate={handleGenerateCaptions}
        imageUrl={
          activeMediaItem?.kind === "image"
            ? activeMediaItem.cdnUrl || activeMediaItem.url
            : null
        }
        videoTitle={
          activeMediaItem?.kind === "video"
            ? activeMediaItem.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
            : null
        }
        isGenerating={aiGenerating}
      />
      <UnsplashDialog
        open={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onImport={handleExternalImport}
      />
      <CanvaDialog
        open={canvaOpen}
        onClose={() => setCanvaOpen(false)}
        onImport={handleExternalImport}
      />
      <GoogleDriveDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onImport={handleExternalImport}
      />
      <DropboxDialog
        open={dropboxOpen}
        onClose={() => setDropboxOpen(false)}
        onImport={handleExternalImport}
      />

      <CoverImageModal
        open={coverModalOpen}
        videoUrl={isVideoActive ? activeMediaItem.url : null}
        onClose={() => setCoverModalOpen(false)}
        onApply={(dataUrl) => {
          setFrameCoverUrl(dataUrl);
          setCoverModalOpen(false);
          toast({ title: "Frame cover updated", tone: "success" });
        }}
      />

      <CollaboratorsModal
        open={collaboratorsModalOpen}
        collaborators={collaborators}
        onSave={(list) => {
          setCollaborators(list);
          toast({
            title: list.length === 0 ? "Collaborators cleared" : `${list.length} collaborator${list.length > 1 ? "s" : ""} added`,
            tone: "success",
          });
        }}
        onClose={() => setCollaboratorsModalOpen(false)}
      />

      <CropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageUrl={activeMediaItem?.kind === "image" ? activeMediaItem.url : null}
        onApply={() => {
          setCropModalOpen(false);
          toast({ title: "Crop applied", tone: "success" });
        }}
      />

      <AltTextModal
        open={altTextModalOpen}
        onClose={() => setAltTextModalOpen(false)}
        imageUrl={activeMediaItem?.kind === "image" ? activeMediaItem.url : null}
        onSave={(value) => {
          toast({
            title: value ? "Alt text saved" : "Alt text cleared",
            tone: "success",
          });
        }}
      />

      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={(d) => {
          setScheduleModalOpen(false);
          void publishPost(d);
        }}
      />

      {/* Hidden custom cover file input */}
      <input
        ref={customCoverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          setCustomCoverUrl(url);
          toast({ title: "Custom cover uploaded", tone: "success" });
          e.target.value = "";
        }}
      />
    </div>
  );
}

// =========================
// Media card
// =========================

interface MediaCardProps {
  tab: MediaTab;
  onTabChange: (t: MediaTab) => void;
  items: MediaItem[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onPickFiles: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenUnsplash: () => void;
  onOpenGenerateAI: () => void;
  onOpenCanva: () => void;
  onOpenDrive: () => void;
  onOpenDropbox: () => void;
  zoom: number;
  onZoomChange: (n: number) => void;
  collaboratorsCount: number;
  onOpenCollaborators: () => void;
  onOpenCrop: () => void;
  onOpenAltText: () => void;
  onOpenTagUsers: () => void;
  customCoverUrl: string | null;
  frameCoverUrl: string | null;
  onOpenCoverModal: () => void;
  onPickCustomCover: () => void;
  onRemoveCustomCover: () => void;
}

function MediaCard({
  tab,
  onTabChange,
  items,
  activeIndex,
  onActiveChange,
  onFiles,
  onRemove,
  onPickFiles,
  fileInputRef,
  onOpenUnsplash,
  onOpenGenerateAI,
  onOpenCanva,
  onOpenDrive,
  onOpenDropbox,
  zoom,
  onZoomChange,
  collaboratorsCount,
  onOpenCollaborators,
  onOpenCrop,
  onOpenAltText,
  onOpenTagUsers,
  customCoverUrl,
  frameCoverUrl,
  onOpenCoverModal,
  onPickCustomCover,
  onRemoveCustomCover,
}: MediaCardProps) {
  const [dragging, setDragging] = useState(false);
  const active = items[activeIndex];
  const atMax = items.length >= MAX_FILES;

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (dropped.length > 0) onFiles(dropped);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <StepCircle n={1} />
            <div className="flex flex-row items-center gap-2">
              <h3 className="text-lg font-semibold leading-none">Media</h3>
              <span className="text-xs font-normal text-zinc-500/70 ml-1">(optional)</span>
            </div>
            {active ? (
              <div className="flex items-center flex-wrap gap-2">
                <Pill icon={<ImageIcon className="size-3" />} label={active.kind === "image" ? "Image" : "Video"} />
                <Pill label={formatBytes(active.size)} />
                {active.kind === "image" && active.width > 0 ? (
                  <Pill label={`${active.width}×${active.height}px`} />
                ) : null}
                {items.length > 1 ? (
                  <Pill label={`${items.length}/${MAX_FILES} files`} />
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-zinc-100 text-zinc-500"
          >
            <Settings className="size-4" />
          </button>
        </div>

        {active ? (
          <UploadedState
            items={items}
            activeIndex={activeIndex}
            onActiveChange={onActiveChange}
            onRemove={onRemove}
            zoom={zoom}
            onZoomChange={onZoomChange}
            collaboratorsCount={collaboratorsCount}
            onOpenCollaborators={onOpenCollaborators}
            onOpenCrop={onOpenCrop}
            onOpenAltText={onOpenAltText}
            onOpenTagUsers={onOpenTagUsers}
          />
        ) : (
          <EmptyState
            tab={tab}
            onTabChange={onTabChange}
            dragging={dragging}
            setDragging={setDragging}
            onDrop={onDrop}
            onPickFiles={onPickFiles}
            atMax={atMax}
            onUnsplash={onOpenUnsplash}
            onGenerateAI={onOpenGenerateAI}
            onCanva={onOpenCanva}
            onDrive={onOpenDrive}
            onDropbox={onOpenDropbox}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function EmptyState({
  tab,
  onTabChange,
  dragging,
  setDragging,
  onDrop,
  onPickFiles,
  atMax,
  onUnsplash,
  onGenerateAI,
  onCanva,
  onDrive,
  onDropbox,
}: {
  tab: MediaTab;
  onTabChange: (t: MediaTab) => void;
  dragging: boolean;
  setDragging: (b: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onPickFiles: () => void;
  atMax: boolean;
  onUnsplash: () => void;
  onGenerateAI: () => void;
  onCanva: () => void;
  onDrive: () => void;
  onDropbox: () => void;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!atMax) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !atMax && onPickFiles()}
      role="button"
      tabIndex={0}
      aria-disabled={atMax}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        dragging ? "border-blue-500 bg-blue-50/30" : "border-zinc-300 hover:bg-zinc-50",
        atMax && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <div className="absolute top-2 right-2 inline-flex items-center rounded-md border border-zinc-300 bg-white/80 p-0.5 gap-0.5">
        {MEDIA_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTabChange(t.id);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
              tab === t.id ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[160px] gap-2">
        <ImageIcon className="size-6 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-900">
          Drag and drop media{tab === "paste" ? " URL or paste content" : " here"}
        </p>
        <p className="text-xs text-zinc-500">or click to browse</p>

        <div className="mt-3 flex items-center flex-wrap justify-center gap-2">
          <span className="text-xs text-zinc-500">Import from:</span>
          <ImportButton label="Generate with AI" tone="violet" onClick={onGenerateAI} />
          <ImportButton label="Unsplash" tone="blue" onClick={onUnsplash} />
          <ImportButton label="Canva" tone="cyan" onClick={onCanva} />
          <ImportButton label="Google Drive" tone="amber" onClick={onDrive} />
          <ImportButton label="Dropbox" tone="blue" onClick={onDropbox} />
        </div>
      </div>
    </div>
  );
}

function ImportButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "violet" | "blue" | "cyan" | "amber";
  onClick?: () => void;
}) {
  const toneClass = {
    violet: "text-violet-600",
    blue: "text-blue-600",
    cyan: "text-cyan-600",
    amber: "text-amber-600",
  }[tone];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium shadow-sm hover:bg-zinc-50"
      )}
    >
      <Type className={cn("size-3.5", toneClass)} />
      {label}
    </button>
  );
}

function UploadedState({
  items,
  activeIndex,
  onActiveChange,
  onRemove,
  zoom,
  onZoomChange,
  collaboratorsCount,
  onOpenCollaborators,
  onOpenCrop,
  onOpenAltText,
  onOpenTagUsers,
}: {
  items: MediaItem[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onRemove: (id: string) => void;
  zoom: number;
  onZoomChange: (n: number) => void;
  collaboratorsCount: number;
  onOpenCollaborators: () => void;
  onOpenCrop: () => void;
  onOpenAltText: () => void;
  onOpenTagUsers: () => void;
}) {
  const active = items[activeIndex];
  const isImage = active.kind === "image";
  return (
    <div className="space-y-3">
      {/* Zoom slider — appears when media is uploaded (matches original: icon + slider + icon) */}
      <div className="flex items-center gap-2 px-1">
        <ZoomOut className="size-4 text-zinc-400 flex-shrink-0" />
        <input
          type="range"
          min={200}
          max={400}
          step={10}
          value={zoom}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
          aria-label="Preview zoom"
          className="flex-1 h-1 accent-zinc-950 cursor-pointer"
        />
        <ZoomIn className="size-4 text-zinc-400 flex-shrink-0" />
      </div>

      {/* Main preview + thumbs strip */}
      <div className="flex gap-2">
        <div className="flex-shrink-0 w-16 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
          {items.map((m, i) => (
            <div
              key={m.id}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-colors",
                i === activeIndex ? "border-zinc-950" : "border-transparent hover:border-zinc-300"
              )}
            >
              <button
                type="button"
                onClick={() => onActiveChange(i)}
                aria-label={`Select ${m.name}`}
                className="absolute inset-0 w-full h-full"
              />
              {m.kind === "image" ? (
                <img src={m.url} alt={m.name} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-[10px] pointer-events-none">
                  VID
                </div>
              )}
              <button
                type="button"
                aria-label="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(m.id);
                }}
                className="absolute -top-1 -right-1 size-5 inline-flex items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm z-10"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <div
          className="flex-1 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 relative"
          style={{ aspectRatio: zoom / 100 }}
        >
          {active.kind === "image" ? (
            <img src={active.url} alt="Preview" className="w-full h-full object-contain bg-zinc-100" />
          ) : (
            <video src={active.url} controls className="w-full h-full object-contain bg-zinc-100" />
          )}
        </div>
      </div>

      {/* Action row — Crop / Alt text / Tag users / Collaborators (matches reference) */}
      <div className="flex flex-wrap items-center gap-2">
        <MediaAction
          icon={<Crop className="size-3.5" />}
          label="Crop"
          onClick={onOpenCrop}
          disabled={!isImage}
        />
        <MediaAction
          icon={<FileText className="size-3.5" />}
          label="Alt text"
          onClick={onOpenAltText}
          disabled={!isImage}
        />
        <MediaAction
          icon={<AtSign className="size-3.5" />}
          label="Tag users (0)"
          onClick={onOpenTagUsers}
        />
        <MediaAction
          icon={<Users className="size-3.5" />}
          label={`Collaborators (${collaboratorsCount})`}
          onClick={onOpenCollaborators}
        />
      </div>
    </div>
  );
}

function MediaAction({
  icon,
  label,
  prefix,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  prefix?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-black border-2 border-black rounded-md text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
      {prefix ? <span className="font-bold">{prefix}</span> : null}
      <span>{label}</span>
    </button>
  );
}

function Pill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readImageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

// =========================
// Accounts card
// =========================

interface AccountsCardProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  remember: boolean;
  onRememberChange: (b: boolean) => void;
  feedType: "feed" | "story";
  onFeedTypeChange: (t: "feed" | "story") => void;
  onlyImage: boolean;
}

function CoverSections({
  frameCoverUrl,
  customCoverUrl,
  onOpenFrameModal,
  onPickCustomCover,
  onRemoveCustomCover,
}: {
  frameCoverUrl: string | null;
  customCoverUrl: string | null;
  onOpenFrameModal: () => void;
  onPickCustomCover: () => void;
  onRemoveCustomCover: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Video Frame Cover */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold">Video Frame Cover</h4>
            <button
              type="button"
              aria-label="About Video Frame Cover"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Info className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed min-h-[36px]">
            Select a frame from your video to use as the cover image
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-14 h-20 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
              {frameCoverUrl ? (
                <img src={frameCoverUrl} alt="Frame cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-200" />
              )}
            </div>
            <button
              type="button"
              onClick={onOpenFrameModal}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
            >
              <RefreshCw className="size-3.5" />
              Change Frame
            </button>
          </div>
        </div>

        {/* Custom Cover Image */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold">Custom Cover Image</h4>
            <button
              type="button"
              aria-label="About Custom Cover Image"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Info className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed min-h-[36px]">
            Upload your own custom thumbnail image (instead of frame)
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-14 h-20 rounded-md overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center flex-shrink-0">
              {customCoverUrl ? (
                <img src={customCoverUrl} alt="Custom cover" className="w-full h-full object-cover" />
              ) : (
                <Upload className="size-4 text-zinc-400" />
              )}
            </div>
            {customCoverUrl ? (
              <button
                type="button"
                onClick={onRemoveCustomCover}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 h-8 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <X className="size-3.5" />
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={onPickCustomCover}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                <Upload className="size-3.5" />
                Upload Custom
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsCard({
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  remember,
  onRememberChange,
  feedType,
  onFeedTypeChange,
  onlyImage,
}: AccountsCardProps) {
  const hasSelection = selected.size > 0;
  const storyAvailable = useMemo(() => {
    return PLATFORMS.some((p) => selected.has(p.id) && (p.id === "instagram" || p.id === "facebook"));
  }, [selected]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StepCircle n={2} />
            <h3 className="text-lg font-semibold leading-none">Accounts</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => onRememberChange(e.target.checked)}
                className="size-4 rounded-sm border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              />
              Remember
            </label>
            <button
              type="button"
              aria-label="Account settings"
              className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
            >
              <Settings className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSelectAll}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={!hasSelection}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto -mx-1 px-1">
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => {
              const isSel = selected.has(p.id);
              const disabledByMedia = onlyImage && p.videoOnly;
              const disabledReason = disabledByMedia ? "Only video files are supported" : null;
              const disabled = disabledByMedia;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !disabled && onToggle(p.id)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent cursor-pointer"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    disabled={disabled}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4 rounded-sm border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <PlatformAvatar platform={p} size={32} className={cn(disabled && "grayscale")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.handle}</p>
                    {disabledReason ? (
                      <p className="text-[10px] italic text-zinc-500">{disabledReason}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {hasSelection ? (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">Post in:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedType === "feed"}
                  onChange={() => onFeedTypeChange("feed")}
                  className="size-4 rounded-sm border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                />
                Feed
              </label>
              <label
                className={cn(
                  "inline-flex items-center gap-1.5",
                  storyAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={feedType === "story"}
                  onChange={() => onFeedTypeChange("story")}
                  disabled={!storyAvailable}
                  className="size-4 rounded-sm border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                />
                Story
              </label>
            </div>
            {!storyAvailable ? (
              <p className="text-xs text-zinc-500">Stories are only available for FB and IG.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =========================
// Captions card
// =========================

interface CaptionsCardProps {
  platforms: typeof PLATFORMS;
  sameForAll: boolean;
  onSameForAllChange: (b: boolean) => void;
  getCaption: (id: PlatformId) => string;
  setCaption: (id: PlatformId, v: string) => void;
  onGenerate: () => void;
  community: string;
  onCommunityChange: (v: string) => void;
  quoteTweet: string;
  onQuoteTweetChange: (v: string) => void;
  tagUsers: string;
  onTagUsersChange: (v: string) => void;
  showTagUsers: boolean;
  hasVideo: boolean;
  toast: ReturnType<typeof useToast>["toast"];
}

function CaptionsCard({
  platforms,
  sameForAll,
  onSameForAllChange,
  getCaption,
  setCaption,
  onGenerate,
  community,
  onCommunityChange,
  quoteTweet,
  onQuoteTweetChange,
  tagUsers,
  onTagUsersChange,
  showTagUsers,
  hasVideo,
  toast,
}: CaptionsCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <StepCircle n={3} />
            <h3 className="text-lg font-semibold leading-none">Captions</h3>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium shadow-sm"
          >
            <Sparkles className="size-3.5" />
            Generate AI Captions
          </button>
        </div>

        <div className="flex items-center justify-between flex-shrink-0">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <button
              type="button"
              role="switch"
              aria-checked={sameForAll}
              onClick={() => onSameForAllChange(!sameForAll)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                sameForAll ? "bg-zinc-950" : "bg-zinc-200"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 transform rounded-full bg-white transition-transform",
                  sameForAll ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </button>
            <span>Use same caption for all platforms</span>
          </label>
          <HashtagsDropdown
            onInsert={(tags) => {
              if (platforms.length === 0) return;
              const current = getCaption(platforms[0].id);
              const appended = current.trim().length === 0 ? tags.join(" ") : `${current.trim()} ${tags.join(" ")}`;
              setCaption(platforms[0].id, appended);
              toast({ title: `Inserted ${tags.length} tag${tags.length > 1 ? "s" : ""}`, tone: "success" });
            }}
          />
        </div>

        <div className="pr-1">
          {platforms.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 min-h-[300px]">
              <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Type className="size-6 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-700">No accounts selected</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
                Pick accounts in the Accounts card to write platform-specific captions.
              </p>
            </div>
          ) : sameForAll ? (
            <div className="overflow-y-auto max-h-[60vh] rounded-lg">
              <AccountPreviewCard
                platform={{ ...platforms[0], charLimit: 2200, borderClass: "border-zinc-300", textClass: "text-zinc-700", name: "All platforms" }}
                value={getCaption(platforms[0].id)}
                onChange={(v) => setCaption(platforms[0].id, v)}
                hasVideo={hasVideo}
              />
            </div>
          ) : platforms.length === 1 ? (
            <div className="overflow-y-auto max-h-[60vh] rounded-lg">
              <AccountPreviewCard
                platform={platforms[0]}
                value={getCaption(platforms[0].id)}
                onChange={(v) => setCaption(platforms[0].id, v)}
                hasVideo={hasVideo}
                community={community}
                onCommunityChange={onCommunityChange}
                quoteTweet={quoteTweet}
                onQuoteTweetChange={onQuoteTweetChange}
              />
            </div>
          ) : (
            // Multi-platform: vertical stack ensures each caption card sits in its own
            // discrete row with no overlap, matching the reference layout exactly.
            <div className="overflow-y-auto max-h-[60vh] space-y-3 rounded-lg pr-1">
              {platforms.map((p) => (
                <AccountPreviewCard
                  key={p.id}
                  platform={p}
                  value={getCaption(p.id)}
                  onChange={(v) => setCaption(p.id, v)}
                  hasVideo={hasVideo}
                  community={community}
                  onCommunityChange={onCommunityChange}
                  quoteTweet={quoteTweet}
                  onQuoteTweetChange={onQuoteTweetChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tag Users — sticky at bottom of card (shared across platforms) */}
        {showTagUsers ? (
          <div className="flex-shrink-0 border-t pt-3">
            <TagUsersInput value={tagUsers} onChange={onTagUsersChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
}