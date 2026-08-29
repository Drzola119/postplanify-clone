"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/contexts/AuthContext";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";
import { fitCaptionForPlatform } from "@/lib/ai/caption-fit";
import { needsOutpainting } from "@/lib/images/platform-ratios";

// Outpainting is intentionally opt-in while the legacy Adsify engine is
// being decoupled from Trustiify. Normal posts must never depend on it.
const ENABLE_OUTPAINT = process.env.NEXT_PUBLIC_ENABLE_OUTPAINT === "true";
import { loadDraft, saveDraft, deleteDraft, newDraftId, type DraftRecord } from "@/lib/drafts";
import {
  type PlatformAdvancedOptions,
  type FieldSpec,
  getDefaultOptions,
  FIELD_SPECS,
} from "@/lib/publishing/advanced-options";
import { type MediaKind } from "@/lib/publishing/capability-matrix";
import { checkRequirements } from "@/lib/publishing/requirements";
import { RequirementsPanel } from "@/components/dashboard/requirements-panel";
import { StepCircle } from "@/components/dashboard/step-circle";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { BrandIcons } from "@/components/dashboard/brand-icons";
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
import { ComposerModeSelector, type ComposerMode } from "@/components/dashboard/composer-mode-selector";
import { CarouselMediaCard, type CarouselItem } from "@/components/dashboard/carousel-media-card";
import { TrialReelCard, type TrialReelMode, type TrialReelFile } from "@/components/dashboard/trial-reel-card";
import { DocumentUploadCard, type DocumentFile } from "@/components/dashboard/document-upload-card";
import { MetadataRulesPanel, type MetadataRules, type MetadataMergeMode } from "@/components/dashboard/metadata-rules-panel";

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
  /** Actual MIME type from file.type (never fabricated). */
  mimeType: string;
  /** Video duration in seconds, populated after metadata probe. */
  durationSec?: number;
  /** False while the browser metadata probe is in progress. Undefined for images. */
  metadataLoaded?: boolean;
  /** Error string when metadata probe fails. */
  metadataError?: string;
  /** Per-file upload status (so the UI can show pending / failed without breaking preview). */
  uploadStatus: "uploading" | "ready" | "error";
  uploadError?: string;
};

/** Return only a URL that can safely be sent to the publishing backend. */
function uploadedMediaUrl(item: Pick<MediaItem, "url" | "cdnUrl">): string | null {
  if (item.cdnUrl) return item.cdnUrl;
  return /^https?:\/\//i.test(item.url) ? item.url : null;
}

const MAX_FILES = 10;

// Headers are sourced from the centralized client-overrides helper. In
// production they resolve to {} so dev-only secrets never leave the server
// env (see src/lib/security/server-config.ts).

export default function CreatePostPage() {
  const t = useTranslations("createPost");
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const { getIdToken, user } = useAuth();

  // Per-user context for draft storage. Bucketing localStorage by the user's
  // Firebase UID keeps two users on the same device from seeing each other's
  // drafts; the bearer token mirrors the latest draft to the server.
  const draftCtx = useMemo(() => ({ uid: user?.uid ?? null }), [user?.uid]);
  const withIdToken = useCallback(async () => {
    const idToken = await getIdToken();
    return { uid: draftCtx.uid, idToken };
  }, [draftCtx.uid, getIdToken]);

  // Detect ?draft=<id> from /dashboard/posts/drafts → Continue button.
  // Restore the full draft state (media metadata, per-platform captions, accounts,
  // collaborators, hashtags, etc.) so the user picks up where they left off.
  // Falls back to server fetch when the draft is not in localStorage
  // (cross-device, cleared storage, or UID key mismatch).
  const [draftId, setDraftId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("draft");
    if (!id) return;
    // Use an async wrapper so we can fallback to server fetch
    (async () => {
      let record = loadDraft(id, draftCtx.uid);
      // Try anon key as fallback before hitting server
      if (!record) {
        try {
          const anon = loadDraft(id, null);
          if (anon) record = anon;
        } catch {}
      }
      if (!record) {
        try {
          const idToken = await getIdToken();
          const headers: Record<string, string> = {
            ...getOverrideHeaders(),
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          };
          const res = await fetch(`/api/drafts/${encodeURIComponent(id)}`, {
            credentials: "include",
            headers,
          });
          if (res.ok) {
            const data = (await res.json()) as { draft?: Record<string, unknown> };
            const d = data.draft as Record<string, unknown> | undefined;
            if (d) {
              // Map server DraftDoc (subset) to local DraftRecord shape
              const platforms = (d.platforms as string[] | undefined) ?? [];
              const mediaItems = (d.mediaItems as Array<{ url?: string; type?: string }> | undefined) ?? [];
              const caption = (d.caption as string | undefined) ?? "";
              record = {
                id: (d.id as string) ?? id,
                createdAt: Date.parse((d.createdAt as string) ?? "") || Date.now(),
                updatedAt: Date.parse((d.updatedAt as string) ?? "") || Date.now(),
                captions: caption ? { __all: caption } : {},
                sameForAll: (d.sameForAll as boolean | undefined) ?? true,
                community: (d.community as string | undefined) ?? "profile",
                quoteTweet: (d.quoteTweetUrl as string | undefined) ?? "",
                tagUsers: Array.isArray(d.tagUsers) ? (d.tagUsers as string[]).join(" ") : "",
                selected: (platforms as never) ?? [],
                collaborators: Array.isArray(d.collaborators) ? (d.collaborators as Array<{ handle?: string }>) .map((c) => c.handle ?? "").filter(Boolean) : [],
                mediaItems: mediaItems.map((m, i) => ({
                  kind: (m.type ?? "image") as "image" | "video",
                  cdnUrl: m.url,
                  localId: `server-${i}-${Date.now()}`,
                  name: "media",
                  mime: m.type === "video" ? "video/mp4" : "image/jpeg",
                })),
                activeMedia: 0,
                customCoverUrl: (d.customCoverUrl as string | null) ?? null,
                frameCoverUrl: (d.frameCoverUrl as string | null) ?? null,
                firstComments: {},
                altTexts: {},
              } as unknown as DraftRecord;
              // Seed localStorage so subsequent loads are instant
              try {
                saveDraft(record as DraftRecord, { uid: draftCtx.uid, idToken });
              } catch {}
            }
          }
        } catch {}
      }
      if (record) {
      setDraftId(id);
      setCaptions(record.captions ?? {});
      setSameForAll(Boolean(record.sameForAll));
      setCommunity(record.community ?? "profile");
      setQuoteTweet(record.quoteTweet ?? "");
      setTagUsers(record.tagUsers ?? "");
      // If the draft contains only images, strip video-only platforms (YouTube) immediately
      // so the UI (PlatformTileBar + Accounts checkboxes + Requirements panel) stay in sync
      // without waiting for the async onlyImage effect. This fixes the "YouTube still
      // shows as selected after Continue" bug seen in screenshots.
      const draftMediaForFilter = (record.mediaItems ?? []).filter((m) => !!(m.cdnUrl ?? (m as unknown as { remoteUrl?: string }).remoteUrl));
      const isImageOnlyDraft = draftMediaForFilter.length > 0 && draftMediaForFilter.every((m) => (m.kind ?? "image") === "image");
      const filteredSelected = isImageOnlyDraft
        ? (record.selected ?? []).filter((pid) => !PLATFORMS.find((p) => p.id === pid)?.videoOnly)
        : (record.selected ?? []);
      if (filteredSelected.length) setSelected(new Set(filteredSelected));
      else if (record.selected?.length) setSelected(new Set(record.selected));
      setCollaborators(record.collaborators ?? []);
      setCustomCoverUrl(record.customCoverUrl ?? null);
      setFrameCoverUrl(record.frameCoverUrl ?? null);
      setFirstComments(record.firstComments ?? {});
      setAltTexts(record.altTexts ?? {});
      if (record.advancedByPlatform) setAdvancedByPlatform(record.advancedByPlatform);
      if (record.metadataRules) {
        const r = record.metadataRules;
        const validMode: MetadataMergeMode = r.mode === "prioritize" || r.mode === "replace_hashtags" ? r.mode : "append";
        setMetadataRules({
          enabled: r.enabled,
          hashtags: r.hashtags ?? [],
          ctaLine: r.ctaLine ?? "",
          mode: validMode,
          startDate: r.startDate ?? "",
          endDate: r.endDate ?? "",
        });
      }
      if (record.composerMode) setComposerMode(record.composerMode);
      if (record.documentTitle) setDocumentTitle(record.documentTitle);
      if (record.trialMode) setTrialMode(record.trialMode as TrialReelMode);
      // Restore media items that have remote URLs (cdn/remote). Local object URLs
      // cannot survive a page reload, so items without one are dropped with a hint.
      const restoredMedia: MediaItem[] = [];
      let droppedLocal = 0;
      (record.mediaItems ?? []).forEach((m, i) => {
        const remote = m.cdnUrl ?? m.remoteUrl;
        if (!remote) { droppedLocal++; return; }
        const kind = m.kind ?? "image";
        const isVideo = kind === "video";
        const durationSec = (m as unknown as { durationSec?: number }).durationSec;
        let metadataLoaded = (m as unknown as { metadataLoaded?: boolean }).metadataLoaded;
        const metadataError = (m as unknown as { metadataError?: string }).metadataError;
        // Backwards compat: old drafts have no metadata fields
        if (isVideo) {
          if (durationSec != null) {
            metadataLoaded = true;
          } else if (metadataLoaded == null && !metadataError) {
            // Unknown — will reprobe the remote URL
            metadataLoaded = false;
          }
        }
        restoredMedia.push({
          id: m.localId ?? `restored-${i}-${Date.now()}`,
          url: remote,
          cdnUrl: remote,
          name: m.name ?? "restored",
          size: 0,
          width: 0,
          height: 0,
          kind,
          mimeType: m.mime ?? (kind === "video" ? "video/mp4" : "image/jpeg"),
          durationSec,
          metadataLoaded: isVideo ? metadataLoaded : undefined,
          metadataError,
          uploadStatus: "ready",
        });
      });
      if (restoredMedia.length > 0) {
        setMediaItems(restoredMedia);
        setActiveMedia(Math.min(record.activeMedia ?? 0, restoredMedia.length - 1));
        // Re-probe remote videos whose metadata is still unknown/loading
        for (const m of restoredMedia) {
          if (m.kind === "video" && m.metadataLoaded === false && m.url) {
            probeVideoDuration(m.url, (dur, err) => {
              setMediaItems((prev) => prev.map((it) => it.id === m.id ? { ...it, durationSec: dur, metadataLoaded: true, metadataError: err } : it));
            });
          }
        }
      }
      // Restore carousel / trial reel / document draft state
      if (record.carouselItems && record.carouselItems.length > 0) {
        const restoredCarousel: CarouselItem[] = record.carouselItems.filter((c) => c.cdnUrl).map((c, i) => {
          const isVideo = c.kind === "video";
          let metadataLoaded = (c as unknown as { metadataLoaded?: boolean }).metadataLoaded;
          const metadataError = (c as unknown as { metadataError?: string }).metadataError;
          const durationSec = (c as unknown as { durationSec?: number }).durationSec;
          if (isVideo && durationSec != null) metadataLoaded = true;
          else if (isVideo && metadataLoaded == null && !metadataError) metadataLoaded = false;
          // File is synthetic for restored remote; size unknown
          const fakeFile = new File([], c.name ?? `carousel-${i}`, { type: c.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg") });
          return {
            id: `restored-carousel-${i}-${Date.now()}`,
            file: fakeFile,
            previewUrl: c.cdnUrl!,
            kind: c.kind,
            mimeType: c.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg"),
            durationSec,
            metadataLoaded: isVideo ? metadataLoaded : undefined,
            metadataError,
            cdnUrl: c.cdnUrl,
            uploadStatus: "ready" as const,
            uploadProgress: 100,
          };
        });
        setCarouselItems(restoredCarousel);
        for (const c of restoredCarousel) {
          if (c.kind === "video" && c.metadataLoaded === false && c.previewUrl) {
            probeVideoDuration(c.previewUrl, (dur, err) => {
              setCarouselItems((prev) => prev.map((it) => it.id === c.id ? { ...it, durationSec: dur, metadataLoaded: true, metadataError: err } : it));
            });
          }
        }
      }
      if (record.trialReelFile?.cdnUrl) {
        const tr = record.trialReelFile as unknown as { cdnUrl: string; name: string; mimeType?: string; durationSec?: number; metadataLoaded?: boolean; metadataError?: string };
        let metadataLoaded = tr.metadataLoaded;
        const metadataError = tr.metadataError;
        const durationSec = tr.durationSec;
        if (durationSec != null) metadataLoaded = true;
        else if (metadataLoaded == null && !metadataError) metadataLoaded = false;
        const fakeFile = new File([], tr.name ?? "trial-reel", { type: tr.mimeType ?? "video/mp4" });
        const restoredTrial: TrialReelFile = {
          file: fakeFile,
          previewUrl: tr.cdnUrl,
          mimeType: tr.mimeType ?? "video/mp4",
          durationSec,
          metadataLoaded,
          metadataError,
          cdnUrl: tr.cdnUrl,
          uploadStatus: "ready",
          uploadProgress: 100,
        };
        setTrialReelFile(restoredTrial);
        if (restoredTrial.metadataLoaded === false && restoredTrial.previewUrl) {
          probeVideoDuration(restoredTrial.previewUrl, (dur, err) => {
            setTrialReelFile((prev) => prev ? { ...prev, durationSec: dur, metadataLoaded: true, metadataError: err } : prev);
          });
        }
      }
      if (record.documentFile?.cdnUrl) {
        const df = record.documentFile;
        const fakeFile = new File([], df.name ?? "document", { type: df.mimeType ?? "application/pdf" });
        setDocumentFile({ file: fakeFile, cdnUrl: df.cdnUrl, uploadStatus: "ready", uploadProgress: 100 } as unknown as DocumentFile);
      }
      toast({
        title: t("draftRestored"),
        description: droppedLocal > 0
          ? t("draftDropped", { count: droppedLocal })
          : t("draftAllLoaded"),
        tone: "info",
      });
    } else {
        toast({ title: t("draftNotFound", { id }), tone: "error" });
      }
      // Strip ?draft= from the URL so a refresh doesn't re-fire the restore.
      params.delete("draft");
      const next = params.toString();
      const clean = window.location.pathname + (next ? `?${next}` : "");
      window.history.replaceState({}, "", clean);
    })();
  }, [toast, draftCtx.uid, getIdToken]);

  // Connected accounts fetched from the server (only these should appear in the picker).
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<PlatformId>>(new Set());
  const [destinationOptions, setDestinationOptions] = useState<{
    boards: Array<{ value: string; label: string }>;
    pages: Array<{ value: string; label: string }>;
  }>({ boards: [], pages: [] });
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const accountsReqIdRef = useRef(0);

  // Ref for focusing the TagUsersInput from the media action row
  const tagUsersRef = useRef<HTMLDivElement | null>(null);

  // Account selection — initialises to empty; populated after we know what's connected.
  const [selected, setSelected] = useState<Set<PlatformId>>(new Set());

  // Restore "remember" preference from localStorage (scoped by uid).
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const reqId = ++accountsReqIdRef.current;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social-accounts/list", { credentials: "include" });
        if (cancelled || reqId !== accountsReqIdRef.current) return;
        if (!res.ok) {
          setAccountsError(true);
          return;
        }
        const data = (await res.json()) as {
          ok?: boolean;
          accounts?: { id: string; platform: string; platformUsername?: string | null; displayName?: string | null }[];
          destinations?: { boards?: { id: string; name: string }[]; pages?: { id: string; name: string }[] };
        };
        if (cancelled || reqId !== accountsReqIdRef.current) return;
        if (!data.ok || !data.accounts) {
          setAccountsError(true);
          return;
        }
        const platformIds = new Set<PlatformId>();
        for (const acct of data.accounts) {
          const pid = acct.platform as PlatformId;
          if (PLATFORMS.some((p) => p.id === pid)) platformIds.add(pid);
        }
        if (cancelled || reqId !== accountsReqIdRef.current) return;
        setConnectedPlatforms(platformIds);
        setDestinationOptions({
          boards: (data.destinations?.boards ?? []).map((item) => ({ value: item.id, label: item.name })),
          pages: (data.destinations?.pages ?? []).map((item) => ({ value: item.id, label: item.name })),
        });
        const facebookAccount = data.accounts.find((acct) => acct.platform === "facebook" && acct.platformUsername);
        if (facebookAccount?.platformUsername && !(data.destinations?.pages?.length)) {
          setDestinationOptions((prev) => ({
            ...prev,
            pages: [{ value: facebookAccount.platformUsername!, label: facebookAccount.displayName ?? `Facebook Page (${facebookAccount.platformUsername})` }],
          }));
        }
        setAccountsError(false);
        if (platformIds.size > 0) setSelected(new Set(platformIds));
      } catch {
        // offline / network error
        if (!cancelled && reqId === accountsReqIdRef.current) setAccountsError(true);
      } finally {
        if (!cancelled && reqId === accountsReqIdRef.current) setAccountsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist / restore "remember" preference in localStorage scoped by uid.
  useEffect(() => {
    if (!draftCtx.uid) return;
    const key = `remember_accounts:${draftCtx.uid}`;
    const stored = localStorage.getItem(key);
    if (stored !== null) setRemember(stored === "true");
  }, [draftCtx.uid]);

  const handleRememberChange = useCallback((next: boolean) => {
    setRemember(next);
    if (draftCtx.uid) {
      localStorage.setItem(`remember_accounts:${draftCtx.uid}`, String(next));
    }
  }, [draftCtx.uid]);

  // Retry fetching social accounts after an error.
  const retryAccountsLoad = useCallback(() => {
    const reqId = ++accountsReqIdRef.current;
    setAccountsError(false);
    setAccountsLoaded(false);
    setConnectedPlatforms(new Set());
    (async () => {
      try {
        const res = await fetch("/api/social-accounts/list", { credentials: "include" });
        if (reqId !== accountsReqIdRef.current) return;
        if (!res.ok) { setAccountsError(true); return; }
        const data = (await res.json()) as {
          ok?: boolean;
          accounts?: { id: string; platform: string; platformUsername?: string | null; displayName?: string | null }[];
          destinations?: { boards?: { id: string; name: string }[]; pages?: { id: string; name: string }[] };
        };
        if (reqId !== accountsReqIdRef.current) return;
        if (!data.ok || !data.accounts) { setAccountsError(true); return; }
        const platformIds = new Set<PlatformId>();
        for (const acct of data.accounts) {
          const pid = acct.platform as PlatformId;
          if (PLATFORMS.some((p) => p.id === pid)) platformIds.add(pid);
        }
        if (reqId !== accountsReqIdRef.current) return;
        setConnectedPlatforms(platformIds);
        setDestinationOptions({
          boards: (data.destinations?.boards ?? []).map((item) => ({ value: item.id, label: item.name })),
          pages: (data.destinations?.pages ?? []).map((item) => ({ value: item.id, label: item.name })),
        });
        const facebookAccount = data.accounts.find((acct) => acct.platform === "facebook" && acct.platformUsername);
        if (facebookAccount?.platformUsername && !(data.destinations?.pages?.length)) {
          setDestinationOptions((prev) => ({
            ...prev,
            pages: [{ value: facebookAccount.platformUsername!, label: facebookAccount.displayName ?? `Facebook Page (${facebookAccount.platformUsername})` }],
          }));
        }
        setAccountsError(false);
        if (platformIds.size > 0) setSelected(new Set(platformIds));
      } catch {
        if (reqId === accountsReqIdRef.current) setAccountsError(true);
      } finally {
        if (reqId === accountsReqIdRef.current) setAccountsLoaded(true);
      }
    })();
  }, []);
  const [feedType, setFeedType] = useState<"feed" | "story">("feed");

  // Per-account captions
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [sameForAll, setSameForAll] = useState(false);

  // Per-account first comments
  const [firstComments, setFirstComments] = useState<Record<string, string>>({});

  // Community + quote tweet (X-specific)
  const [community, setCommunity] = useState("profile");
  const [quoteTweet, setQuoteTweet] = useState("");

  // Tag Users (shown when media uploaded)
  const [tagUsers, setTagUsers] = useState("");

  /** Per-media-item alt text (keyed by media id). */
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});

  // Per-platform advanced publishing options (Feature 1).
  // Keyed by PlatformId; defaults are seeded lazily so the user only
  // sees advanced fields for platforms that have any.
  const [advancedByPlatform, setAdvancedByPlatform] = useState<Partial<Record<PlatformId, PlatformAdvancedOptions>>>({});

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
  // tagUsersModalOpen removed — TagUsersInput in CaptionsCard is the canonical control.
  // onOpenTagUsers scrolls to it via a ref (see tagUsersRef below).

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

  // Composer mode (Standard / Carousel / Trial Reel / Document)
  const [composerMode, setComposerMode] = useState<ComposerMode>("standard");

  // Carousel state
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  // Trial Reel state
  const [trialReelFile, setTrialReelFile] = useState<TrialReelFile | null>(null);
  const [trialMode, setTrialMode] = useState<TrialReelMode>("TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED");

  // Document state
  const [documentFile, setDocumentFile] = useState<DocumentFile | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");

  // Metadata rules (Campaign Rules panel)
  const [metadataRules, setMetadataRules] = useState<MetadataRules>({
    enabled: false,
    hashtags: [],
    ctaLine: "",
    mode: "append",
    startDate: "",
    endDate: "",
  });
  const [rulesOpen, setRulesOpen] = useState(false);

  const [requirementsOpen, setRequirementsOpen] = useState(false);

  // Keep schedule and publish submission states distinct. Sharing one boolean
  // made a schedule action render as "Publishing…" and obscured which backend
  // path was actually running.
  const [submissionMode, setSubmissionMode] = useState<"idle" | "scheduling" | "publishing">("idle");
  const submitting = submissionMode !== "idle";
  // Outpainting pipeline phase (image → per-platform variants → per-platform publish).
  // "idle" when the standard single-shot publish is used.
  const [outpaintPhase, setOutpaintPhase] = useState<
    "idle" | "generating" | "delivering"
  >("idle");

  const selectedPlatforms = useMemo(
    () => PLATFORMS.filter((p) => selected.has(p.id)),
    [selected]
  );

  // Mode-switch reset: when the user picks a new composer mode we drop the
  // previous mode's media + clear stale captions/options keyed by no-longer-
  // selected platforms. Without this, switching Trial Reel → Standard leaves
  // a Reel file in state and a publish gate that can't see it (#13/#14/#16).
  const prevModeRef = useRef<ComposerMode>(composerMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prev = prevModeRef.current;
    if (prev === composerMode) return;
    prevModeRef.current = composerMode;
    // Drop the previous mode's file (we can't restore it after mode switch).
    if (prev === "carousel") {
      for (const c of carouselItems) URL.revokeObjectURL(c.previewUrl);
      setCarouselItems([]);
    } else if (prev === "trial_reel") {
      if (trialReelFile) URL.revokeObjectURL(trialReelFile.previewUrl);
      setTrialReelFile(null);
    } else if (prev === "document") {
      setDocumentFile(null);
      setDocumentTitle("");
    } else {
      // prev === "standard": drop the standard media items
      for (const m of mediaItems) URL.revokeObjectURL(m.url);
      setMediaItems([]);
      setActiveMedia(0);
    }
    // Drop mode-specific alt texts (keyed by media id).
    setAltTexts({});
    // Prune captions/options/firstComments for no-longer-selected platforms.
    setSelected((currentSelected) => {
      const allowed = composerMode === "trial_reel"
        ? new Set<PlatformId>(["instagram"])
        : composerMode === "document"
        ? new Set<PlatformId>(["linkedin"])
        : new Set<PlatformId>(PLATFORMS.map((p) => p.id));
      // Keep current selection if it still fits; otherwise fall back to the mode's default.
      const fitsMode = Array.from(currentSelected).every((id) => allowed.has(id));
      const next = fitsMode ? currentSelected : (
        composerMode === "trial_reel" ? new Set<PlatformId>(["instagram"])
        : composerMode === "document" ? new Set<PlatformId>(["linkedin"])
        : new Set<PlatformId>(PLATFORMS.map((p) => p.id))
      );
      const allowedIds = new Set(Array.from(next));
      setCaptions((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k === "__all" || allowedIds.has(k as PlatformId))));
      setFirstComments((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k === "__all" || allowedIds.has(k as PlatformId))));
      setAdvancedByPlatform((prev) => {
        const out: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) if (allowedIds.has(k as PlatformId)) out[k as PlatformId] = v;
        return out;
      });
      return next;
    });
  }, [composerMode]);

  const onlyImage = mediaItems.length > 0 && mediaItems.every((m) => m.kind === "image");
  const hasVideo = mediaItems.some((m) => m.kind === "video");
  const activeMediaItem = mediaItems[activeMedia];
  const isVideoActive = activeMediaItem?.kind === "video";

  // YouTube accepts video uploads only. Remove it from the active target set
  // as soon as an image-only post is loaded so it cannot receive a caption or
  // block an otherwise valid image publish.
  useEffect(() => {
    if (!onlyImage) return;
    setSelected((current) => {
      const next = new Set(Array.from(current).filter((id) => !PLATFORMS.find((p) => p.id === id)?.videoOnly));
      return next.size === current.size ? current : next;
    });
  }, [onlyImage]);

  // Select the first API-provided destination once, while preserving a
  // destination the user has already chosen.
  useEffect(() => {
    setAdvancedByPlatform((current) => {
      const next = { ...current };
      if (destinationOptions.boards.length > 0 && !next.pinterest?.pinterest_board_id) {
        next.pinterest = { ...getDefaultOptions("pinterest"), ...next.pinterest, pinterest_board_id: destinationOptions.boards[0].value };
      }
      if (destinationOptions.pages.length > 0 && !next.facebook?.facebook_page_id) {
        next.facebook = { ...getDefaultOptions("facebook"), ...next.facebook, facebook_page_id: destinationOptions.pages[0].value };
      }
      return next;
    });
  }, [destinationOptions]);

  // Media kind for the advanced options panel (Feature 1).
  // Empty state → "text"; mixed media → prefers video for the rules.
  const composerMediaKind: MediaKind =
    composerMode === "carousel"
      ? (carouselItems.every((c) => c.kind === "image") ? "image" : "video")
      : composerMode === "trial_reel"
      ? "video"
      : composerMode === "document"
      ? "text"
      : mediaItems.length === 0
      ? "text"
      : mediaItems.every((m) => m.kind === "image")
      ? "image"
      : "video";

  // Per-platform advanced options getter (seeds defaults lazily).
  function getAdvancedOptions(id: PlatformId): PlatformAdvancedOptions {
    return advancedByPlatform[id] ?? getDefaultOptions(id);
  }
  function setAdvancedOptions(id: PlatformId, next: PlatformAdvancedOptions) {
    setAdvancedByPlatform((prev) => ({ ...prev, [id]: next }));
  }

  // Live readiness report for the publishability gate (Feature 2).
  const readinessReport = useMemo(
    () => {
      const mediaList =
        composerMode === "carousel"
          ? carouselItems.map((c) => ({
              kind: c.kind,
              mimeType: c.mimeType,
              sizeBytes: c.file.size,
              durationSec: c.durationSec,
              metadataLoaded: c.metadataLoaded,
              metadataError: c.metadataError,
            }))
          : composerMode === "trial_reel" && trialReelFile
          ? [{
              kind: "video" as const,
              mimeType: trialReelFile.mimeType,
              sizeBytes: trialReelFile.file.size,
              durationSec: trialReelFile.durationSec,
              metadataLoaded: trialReelFile.metadataLoaded,
              metadataError: trialReelFile.metadataError,
            }]
          : composerMode === "document" && documentFile
          ? []
          : mediaItems.map((m) => ({
              kind: m.kind,
              mimeType: m.mimeType,
              sizeBytes: m.size,
              durationSec: m.durationSec,
              metadataLoaded: m.metadataLoaded,
            }));

      const report = checkRequirements(Array.from(selected), {
        captionByPlatform: Object.fromEntries(
          Array.from(selected).map((p) => [p, captionFor(p)])
        ) as Record<PlatformId, string>,
        media: mediaList,
        advancedByPlatform,
        composerMediaKind,
      });

      if (composerMode === "document") {
        for (const p of report.perPlatform) {
          if (p.platform === "linkedin") {
            if (!documentFile) {
              p.issues.unshift({
                code: "missing_document",
                severity: "blocked",
                message: "Upload a document (PDF, DOC, PPT) for LinkedIn.",
                actionLabel: "Upload document",
              });
            } else if (documentFile.pageCount && documentFile.pageCount > 300) {
              p.issues.unshift({
                code: "document_too_many_pages",
                severity: "blocked",
                message: `Document has ~${documentFile.pageCount} pages. LinkedIn enforces a maximum of 300 pages.`,
                actionLabel: "Split document",
              });
            } else if (!documentTitle.trim()) {
              p.issues.unshift({
                code: "missing_document_title",
                severity: "blocked",
                message: "Document title is required for LinkedIn.",
                actionLabel: "Enter title",
              });
            }
            const hasBlock = p.issues.some((i) => i.severity === "blocked");
            const hasWarn = p.issues.some((i) => i.severity === "warning");
            p.severity = hasBlock ? "blocked" : hasWarn ? "warning" : "ready";
            p.summary = hasBlock
              ? (p.issues.find((i) => i.severity === "blocked")?.message ?? "Has issues.")
              : hasWarn
              ? (p.issues.find((i) => i.severity === "warning")?.message ?? "Has warnings.")
              : "Ready to publish to LinkedIn.";
          }
        }
        report.blockedCount = report.perPlatform.filter((p) => p.severity === "blocked").length;
        report.warningCount = report.perPlatform.filter((p) => p.severity === "warning").length;
        report.readyCount = report.perPlatform.filter((p) => p.severity === "ready").length;
        report.overall = report.blockedCount > 0 ? "blocked" : report.warningCount > 0 ? "warning" : "ready";
      }

      return report;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [captions, sameForAll, mediaItems, carouselItems, trialReelFile, documentFile, documentTitle, advancedByPlatform, selected, composerMediaKind, composerMode]
  );

  function toggleAccount(id: PlatformId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(PLATFORMS.filter((p) => !(onlyImage && p.videoOnly)).map((p) => p.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function startOver() {
    // Revoke any leftover object URLs to avoid memory leaks.
    for (const m of mediaItems) if (m.url) URL.revokeObjectURL(m.url);
    for (const c of carouselItems) if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
    if (trialReelFile?.previewUrl) URL.revokeObjectURL(trialReelFile.previewUrl);
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
    setFirstComments({});
    setAltTexts({});
    setAdvancedByPlatform({});
    setMetadataRules({ enabled: false, hashtags: [], ctaLine: "", mode: "append", startDate: "", endDate: "" });
    setRulesOpen(false);
    // Reset mode-specific state
    setComposerMode("standard");
    setCarouselItems([]);
    setTrialReelFile(null);
    setTrialMode("TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED");
    setDocumentFile(null);
    setDocumentTitle("");
    toast({ title: t("resetTitle"), description: t("resetDescription"), tone: "info" });
  }

  async function handleSaveDraft() {
    const pendingUpload =
      mediaItems.some((m) => m.uploadStatus === "uploading") ||
      carouselItems.some((c) => c.uploadStatus === "uploading") ||
      (trialReelFile?.uploadStatus === "uploading") ||
      (documentFile?.uploadStatus === "uploading");
    if (pendingUpload) {
      toast({
        title: "Media still uploading",
        description: "Your draft will be saved but the image thumbnail may show as pending until the upload finishes. Try saving again after uploads complete.",
        tone: "warning",
      });
    }
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
      firstComments,
      altTexts,
      advancedByPlatform,
      metadataRules,
      composerMode,
      trialMode,
      documentTitle,
      carouselItems: carouselItems.map((c) => ({
        cdnUrl: c.cdnUrl ?? "",
        name: c.file?.name ?? "carousel",
        kind: c.kind,
        mimeType: c.mimeType,
        durationSec: c.durationSec,
        metadataLoaded: c.metadataLoaded,
        metadataError: c.metadataError,
      })),
      trialReelFile: trialReelFile
        ? { cdnUrl: trialReelFile.cdnUrl ?? "", name: trialReelFile.file?.name ?? "trial-reel", mimeType: trialReelFile.mimeType, durationSec: trialReelFile.durationSec, metadataLoaded: trialReelFile.metadataLoaded, metadataError: trialReelFile.metadataError }
        : undefined,
      documentFile: documentFile
        ? {
            cdnUrl: documentFile.cdnUrl ?? "",
            name: documentFile.file?.name ?? "document",
            mimeType: documentFile.file.type,
          }
        : undefined,
      mediaItems: mediaItems.map((m) => ({
        kind: m.kind,
        cdnUrl: m.cdnUrl,
        remoteUrl: undefined,
        localId: m.id,
        name: m.name,
        mime: m.mimeType,
        durationSec: m.durationSec,
        metadataLoaded: m.metadataLoaded,
        metadataError: m.metadataError,
      })),
      activeMedia,
      customCoverUrl,
      frameCoverUrl,
    };
    saveDraft(record, await withIdToken());
    setDraftId(id);
    toast({
      title: t("draftSaved"),
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

  /**
   * Apply campaign metadata rules (hashtags + CTA) to a caption string.
   * Honours the active window so out-of-window posts publish unmodified.
   * Returns the unmodified caption when rules are disabled or out of window.
   */
  function applyMetadataRules(caption: string): string {
    if (!metadataRules.enabled) return caption;
    const now = Date.now();
    if (metadataRules.startDate) {
      const start = Date.parse(metadataRules.startDate);
      if (Number.isFinite(start) && now < start) return caption;
    }
    if (metadataRules.endDate) {
      const end = Date.parse(metadataRules.endDate) + 24 * 60 * 60 * 1000 - 1;
      if (Number.isFinite(end) && now > end) return caption;
    }
    const tags = metadataRules.hashtags.map((t) =>
      t.startsWith("#") ? t : `#${t}`
    );
    const tagStr = tags.join(" ").trim();
    const cta = metadataRules.ctaLine.trim();
    const parts: string[] = [];
    if (metadataRules.mode === "prioritize") {
      if (tagStr) parts.push(tagStr);
      if (cta) parts.push(cta);
      parts.push(caption);
    } else if (metadataRules.mode === "replace_hashtags") {
      parts.push(caption);
      if (cta) parts.push(cta);
      if (tagStr) parts.push(tagStr);
    } else {
      // append
      parts.push(caption);
      if (cta) parts.push(cta);
      if (tagStr) parts.push(tagStr);
    }
    return parts.filter(Boolean).join("\n\n");
  }

  async function publishPost(scheduledAt: Date | null) {
    // Client-side guard against the most common scheduling 400 — a
    // wall-clock that is already in the past due to timezone/operator lag.
    // The server guards the same condition, but catching it here lets us
    // show an immediate, localised message instead of a 400 -> 503 chain.
    if (scheduledAt) {
      if (Number.isNaN(scheduledAt.getTime())) {
        toast({ title: t("scheduleFailed"), description: "Invalid date — please pick the date and time again.", tone: "error" });
        return;
      }
      if (scheduledAt.getTime() <= Date.now()) {
        toast({ title: t("scheduleFailed"), description: `Scheduled time must be in the future (now: ${new Date().toLocaleString()}). Please pick a later time.`, tone: "error" });
        return;
      }
    }

    const platforms = Array.from(selected);
    if (platforms.length === 0) {
      toast({ title: t("pickAccount"), tone: "warning" });
      return;
    }

    // Do not bypass readiness validation even if called programmatically
    if (readinessReport.overall === "blocked") {
      toast({ title: "Requirements not met", description: readinessReport.perPlatform.find((r) => r.severity === "blocked")?.summary ?? "Fix platform requirements before publishing.", tone: "error" });
      return;
    }

    // Build per-platform captions (with metadata rules applied)
    const captionsByPlatform: Record<string, string> = {};
    for (const p of platforms) {
      captionsByPlatform[p] = applyMetadataRules(captionFor(p));
    }
    // Legacy top-level caption — used by older workers that don't understand captionsByPlatform
    const caption = sameForAll
      ? (applyMetadataRules(captions.__all ?? ""))
      : (captionsByPlatform[platforms[0]] ?? "");

    let readyMediaUrls: string[] = [];
    if (composerMode === "standard") {
      const readyMedia = mediaItems
        .map((item) => ({ item, url: uploadedMediaUrl(item) }))
        .filter((entry): entry is { item: MediaItem; url: string } => Boolean(entry.url));
      // Text-only posts are allowed if no media was uploaded at all
      if (readyMedia.length === 0 && mediaItems.length > 0) {
        toast({ title: t("uploadMedia"), tone: "warning" });
        return;
      }
      readyMediaUrls = readyMedia.map((entry) => entry.url);
    } else if (composerMode === "carousel") {
      const readyCarousel = carouselItems.filter((c) => c.cdnUrl);
      if (readyCarousel.length < 2) {
        toast({ title: t("uploadCarousel"), tone: "warning" });
        return;
      }
      readyMediaUrls = readyCarousel.map((c) => c.cdnUrl!);
    } else if (composerMode === "trial_reel") {
      if (!trialReelFile || !trialReelFile.cdnUrl) {
        toast({ title: t("uploadReel"), tone: "warning" });
        return;
      }
      readyMediaUrls = [trialReelFile.cdnUrl];
    } else if (composerMode === "document") {
      if (!documentFile || !documentFile.cdnUrl) {
        toast({ title: t("uploadDocument"), tone: "warning" });
        return;
      }
      if (!documentTitle.trim()) {
        toast({ title: t("documentTitleRequired"), tone: "warning" });
        return;
      }
      readyMediaUrls = [documentFile.cdnUrl];
    }

    // Per-platform first comments: keep all entries whose key is currently
    // selected, plus "__all" for same-for-all.
    const firstCommentByPlatform: Record<string, string> = {};
    for (const [k, v] of Object.entries(firstComments)) {
      if (!v || !v.trim()) continue;
      if (k === "__all") { firstCommentByPlatform.__all = v; continue; }
      if (selected.has(k as PlatformId)) firstCommentByPlatform[k] = v;
    }

    // Per-platform alt text: keyed by active media id; the publish worker
    // applies it to the upload-post.com `alt` field per destination.
    const altTextByPlatform: Record<string, string> = {};
    for (const [mediaId, txt] of Object.entries(altTexts)) {
      if (!txt || !txt.trim()) continue;
      // The worker expects per-platform mapping; mirror the same id for now
      // (alt is per-image, not per-platform — single key covers it).
      const cleanMediaId = mediaId.startsWith("restored-") ? "primary" : mediaId;
      if (!altTextByPlatform[cleanMediaId]) altTextByPlatform[cleanMediaId] = txt.trim();
    }

    const tagUsersList = tagUsers
      .split(/[\s,]+/)
      .map((u) => u.replace(/^@/, "").trim())
      .filter(Boolean);

    // ── Outpainting branch (image only, standard mode, multi-ratio) ─────
    // When the user uploads a single image to multiple platforms that
    // span different ratios (e.g. Instagram 4:5 + LinkedIn 1:1 + X 16:9),
    // the source image must be AI-outpainted into per-ratio variants
    // before publishing. The engine generates variants; trustiify then
    // publishes each variant to its platform(s) under the workspace's own
    // upload-post.com profile.
    const canOutpaint =
      !scheduledAt &&
      ENABLE_OUTPAINT &&
      composerMode === "standard" &&
      composerMediaKind === "image" &&
      readyMediaUrls.length === 1 &&
      needsOutpainting(platforms);

    setSubmissionMode(scheduledAt ? "scheduling" : "publishing");
    try {
      if (canOutpaint) {
        const outpaintResult = await runOutpaintAndDeliver({
          sourceMediaUrl: readyMediaUrls[0]!,
          platforms,
          caption,
          firstCommentByPlatform,
          quoteTweetUrl: quoteTweet.trim() || undefined,
          community,
          tagUsers: tagUsersList,
          feedType,
          altTextByPlatform,
          scheduledAt,
          // Outpaint always operates on a single source image, regardless of
          // composer mode. The engine uses this to decide per-ratio strategy.
          mediaType: "image",
        });
        if (!outpaintResult.ok) {
          // Error toast already shown inside the helper.
          return;
        }
        if (draftId) {
          const removedId = draftId;
          await deleteDraft(removedId, await withIdToken());
          setDraftId(null);
        }
        if (!scheduledAt) startOver();
        return;
      }

      // ── Standard single-shot publish (video / carousel / single-ratio) ─
      // Translate feedType into per-platform advanced options so IG/FB
      // pick up STORIES vs FEED; leave it implicit for other platforms.
      const platformOptions = sameForAll
        ? Object.fromEntries(
            platforms.map((p) => {
              const opts = { ...getAdvancedOptions(platforms[0]) };
              if (composerMode === "document" && p === "linkedin") {
                opts.linkedin_document_title = documentTitle;
              }
              if (composerMode === "trial_reel" && p === "instagram") {
                opts.instagram_media_type = "REELS";
                opts.instagram_share_mode = trialMode;
              }
              if (feedType === "story") {
                if (p === "instagram") opts.instagram_media_type = "STORIES";
                if (p === "facebook") opts.facebook_media_type = "STORIES";
              }
              return [p, opts];
            })
          )
        : Object.fromEntries(
            platforms.map((p) => {
              const opts = { ...getAdvancedOptions(p) };
              if (composerMode === "document" && p === "linkedin") {
                opts.linkedin_document_title = documentTitle;
              }
              if (composerMode === "trial_reel" && p === "instagram") {
                opts.instagram_media_type = "REELS";
                opts.instagram_share_mode = trialMode;
              }
              if (feedType === "story") {
                if (p === "instagram") opts.instagram_media_type = "STORIES";
                if (p === "facebook") opts.facebook_media_type = "STORIES";
              }
              return [p, opts];
            })
          );

      const idToken = await getIdToken();
      const endpoint = scheduledAt ? "/api/posts/schedule" : "/api/posts/publish";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          ...getOverrideHeaders()
        },
        body: JSON.stringify({
          platforms,
          caption,
          captionsByPlatform,
          sameForAll,
          mediaUrls: readyMediaUrls,
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
          advancedByPlatform: platformOptions,
          firstComment: sameForAll ? (firstCommentByPlatform.__all ?? undefined) : undefined,
          firstCommentByPlatform,
          quoteTweetUrl: quoteTweet.trim() || undefined,
          community: community === "profile" ? undefined : community,
          tagUsers: tagUsersList.length > 0 ? tagUsersList : undefined,
          feedType,
          altTextByPlatform,
          // UploadPost selects a different endpoint for video vs photo/text.
          // Sending "standard" here made normal videos look like photo posts.
          mediaType: composerMode === "standard" ? composerMediaKind : composerMode,
          frameCoverUrl: frameCoverUrl ?? undefined,
          customCoverUrl: customCoverUrl ?? undefined,
          collaborators: collaborators.length > 0 ? collaborators : undefined,
          ...(composerMode === "carousel"
            ? { carouselItems: readyMediaUrls.map((url) => ({ url })) }
            : {}),
          ...(composerMode === "trial_reel" && trialReelFile
            ? { trialReel: { url: trialReelFile.cdnUrl ?? readyMediaUrls[0]! } }
            : {}),
          ...(composerMode === "document" && documentFile
            ? { document: { url: documentFile.cdnUrl ?? readyMediaUrls[0]!, title: documentTitle, mimeType: documentFile.file.type } }
            : {}),
        }),
      });
      type PublishResponse = {
        ok?: boolean;
        jobId?: string;
        postId?: string;
        error?: string;
        details?: string;
        issues?: unknown;
        results?: Record<string, { ok: boolean; error?: string }>;
        result?: unknown;
        accepted?: boolean;
        deliveryConfirmed?: boolean;
        final?: boolean;
        scheduled?: boolean;
        scheduledAt?: string;
      };
      let data = (await res.json().catch(() => ({}))) as PublishResponse & { issues?: unknown; details?: string };
      if (!res.ok || !data.ok) {
        // Surface the server's `details` (added for 503 diagnostics) and
        // validation `issues` so the user isn't left with a generic
        // "Unable to save scheduled post" message that can't be actioned.
        const detailHint =
          (data as { details?: string }).details ??
          (data.error && /Database/i.test(data.error) ? data.error : undefined);
        const issuesHint = (data as { issues?: unknown }).issues
          ? ` Validation: ${JSON.stringify((data as { issues?: unknown }).issues)}`
          : "";
        const description =
          (detailHint ? `${data.error ?? "Request failed"} — ${detailHint}${issuesHint}` : undefined) ??
          (data.error ? `${data.error}${issuesHint}` : undefined) ??
          `HTTP ${res.status}${issuesHint}`;
        // Special-case 503 / 403 so users know it's infra, not their content
        const isInfra = res.status === 503 || res.status === 403 || /Database|permission/i.test(description);
        toast({
          title: scheduledAt ? t("scheduleFailed") : t("publishFailed"),
          description: isInfra
            ? `${description} — please retry in a minute or contact support if this persists.`
            : description,
          tone: "error",
        });
        return;
      }
      // Scheduling has its own persistence-only endpoint. Treat only an
      // explicit scheduled acknowledgement as success, then take the user to
      // the calendar so the saved item is immediately visible.
      if (scheduledAt) {
        if (!data.scheduled || !data.postId) {
          toast({
            title: t("scheduleFailed"),
            description: "The server did not confirm that the post was saved to the schedule.",
            tone: "error",
          });
          return;
        }
        const confirmedAt = data.scheduledAt ? new Date(data.scheduledAt) : scheduledAt;
        toast({
          title: t("scheduleSuccess"),
          description: confirmedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
          tone: "success",
        });
        if (draftId) {
          await deleteDraft(draftId, await withIdToken());
          setDraftId(null);
        }
        startOver();
        router.push(`/dashboard/calendar?scheduled=${encodeURIComponent(data.postId)}`);
        return;
      }
      // ── Polling branch: only poll when delivery is genuinely unconfirmed ──
      // The publisher now correctly sets deliveryConfirmed when UploadPost
      // returns HTTP 200, so this branch only fires for true async jobs.
      if (
        data.postId &&
        data.accepted &&
        data.deliveryConfirmed === false &&
        (!data.results || Object.keys(data.results).length === 0)
      ) {
        for (let attempt = 0; attempt < 18; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 5_000));
          const statusResponse = await fetch("/api/posts/publish/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getOverrideHeaders(),
            },
            body: JSON.stringify({ postId: data.postId }),
          });
          const statusData = (await statusResponse.json().catch(() => ({}))) as PublishResponse;
          if (!statusResponse.ok && statusResponse.status !== 202) break;
          // Accept either granular results OR a final+deliveryConfirmed flag
          if (statusData.final) {
            data = { ...data, ...statusData, accepted: true };
            break;
          }
        }
      }
      // ── Delivery confirmed (no granular results needed) ──────────────
      if (data.accepted && data.deliveryConfirmed) {
        // When per-platform results exist, prefer the granular path below.
        // Otherwise treat the whole batch as successfully published.
        const rawResults = (data.results ?? (data.result as { results?: Record<string, { ok: boolean; error?: string }> })?.results) as Record<string, { ok: boolean; error?: string }> | undefined;
        if (!rawResults || Object.keys(rawResults).length === 0) {
          toast({
            title: t("publishSuccess"),
            description: `Published to ${platforms.length} platform${platforms.length === 1 ? "" : "s"}`,
            tone: "success",
          });
          if (draftId) { await deleteDraft(draftId, await withIdToken()); setDraftId(null); }
          startOver();
          return;
        }
      }
      // ── Still unconfirmed after polling ─────────────────────────────
      if (data.accepted && data.deliveryConfirmed === false && (!data.results || Object.keys(data.results).length === 0)) {
        toast({
          title: "Publishing is still processing",
          description: "UploadPost accepted the media but has not confirmed delivery yet. Your composer was kept intact; check Publish History before retrying.",
          tone: "warning",
        });
        return;
      }
      // Handle per-platform results if present (partial publish)
      const rawResults = (data.results ?? (data.result as { results?: Record<string, { ok: boolean; error?: string }> })?.results) as Record<string, { ok: boolean; error?: string }> | undefined;
      if (rawResults && typeof rawResults === "object" && Object.keys(rawResults).length > 0) {
        const entries = Object.entries(rawResults);
        const succeeded = entries.filter(([, v]) => v.ok).map(([k]) => k);
        const failed = entries.filter(([, v]) => !v.ok);
        if (failed.length === 0) {
          toast({
            title: t("publishSuccess"),
            description: `All ${succeeded.length} platforms published`,
            tone: "success",
          });
          if (draftId) { await deleteDraft(draftId, await withIdToken()); setDraftId(null); }
          startOver();
          return;
        } else if (succeeded.length > 0) {
          toast({
            title: `Partial success: ${succeeded.length}/${entries.length} platforms`,
            description: `Succeeded: ${succeeded.join(", ")} • Failed: ${failed.map(([k, v]) => `${k}: ${v.error ?? "unknown"}`).join("; ")}`,
            tone: "warning",
          });
          return;
        } else {
          toast({
            title: t("publishFailed"),
            description: `All platforms failed: ${failed.map(([k, v]) => `${k}: ${v.error ?? "unknown"}`).join("; ")}`,
            tone: "error",
          });
          return;
        }
      }
      // Fallback: no results and delivery not confirmed — but the API said ok.
      toast({
        title: t("publishSuccess"),
        description: "Post accepted — delivery results will appear in Publish History.",
        tone: "success",
      });
      if (draftId) { await deleteDraft(draftId, await withIdToken()); setDraftId(null); }
      startOver();
    } catch (err) {
      toast({
        title: scheduledAt ? t("scheduleFailed") : t("publishFailed"),
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
    } finally {
      setSubmissionMode("idle");
      setOutpaintPhase("idle");
    }
  }

  /**
   * Take a cropped data URL produced by the CropModal, upload it to the
   * CDN, and splice the new URL into the active media item so subsequent
   * publish + alt-text edits target the cropped image.
   */
  async function applyCroppedImage(dataUrl: string, mediaId: string) {
    const file = dataUrlToFile(dataUrl, `cropped_${Date.now()}.jpg`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "posts");
    const uploadId = toast({
      title: t("cropApplied"),
      description: "Uploading cropped image…",
      tone: "info",
    });
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        headers: getOverrideHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setMediaItems((prev) =>
        prev.map((m) => (m.id === mediaId ? { ...m, cdnUrl: data.url, url: data.url!, remoteUrl: undefined } : m))
      );
      dismiss(uploadId);
      toast({ title: t("cropApplied"), tone: "success" });
    } catch (err) {
      dismiss(uploadId);
      toast({
        title: t("cropApplied"),
        description: err instanceof Error ? err.message : "Upload failed",
        tone: "error",
      });
    }
  }

  /**
   * Take a video-frame data URL captured by the CoverImageModal, upload it
   * to the CDN, and store the CDN URL as frameCoverUrl so the publish
   * pipeline can attach it as a custom cover to the underlying video.
   * (Plain data URLs aren't reachable by upload-post.com, so we persist
   * the CDN URL only.)
   */
  async function applyFrameCover(dataUrl: string) {
    const file = dataUrlToFile(dataUrl, `frame_${Date.now()}.jpg`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "posts");
    const uploadId = toast({
      title: t("cover.frameUpdated"),
      description: "Uploading cover frame…",
      tone: "info",
    });
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        headers: getOverrideHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setFrameCoverUrl(data.url);
      setCoverModalOpen(false);
      dismiss(uploadId);
      toast({ title: t("cover.frameUpdated"), tone: "success" });
    } catch (err) {
      setCoverModalOpen(false);
      dismiss(uploadId);
      toast({
        title: t("cover.frameUpdated"),
        description: err instanceof Error ? err.message : "Upload failed",
        tone: "error",
      });
    }
  }

  /**
   * Run the outpaint pipeline for one source image:
   * 1. Forward the source image to /api/images/outpaint (which proxies to
   *    the adsify engine with the caller's Firebase ID token).
   * 2. Poll /api/images/outpaint/[jobId] every 2s, max 120s, until the
   *    engine reports all variants complete.
   * 3. POST to /api/images/deliver with the jobId; that route downloads
   *    each variant from the engine CDN and uploads it to upload-post.com
   *    per-platform under the workspace's own API key + profile username.
   */
  async function runOutpaintAndDeliver(args: {
    sourceMediaUrl: string;
    platforms: string[];
    caption: string;
    firstCommentByPlatform?: Record<string, string>;
    quoteTweetUrl?: string;
    community?: string;
    tagUsers?: string[];
    feedType?: "feed" | "story";
    altTextByPlatform?: Record<string, string>;
    scheduledAt: Date | null;
    mediaType: string;
  }): Promise<{ ok: boolean; postId?: string; results?: unknown[] }> {
    const {
      sourceMediaUrl,
      platforms,
      caption,
      firstCommentByPlatform,
      quoteTweetUrl,
      community,
      tagUsers,
      feedType,
      altTextByPlatform,
      scheduledAt,
      mediaType,
    } = args;

    // Flatten per-platform first comments to a single string for the
    // engine's "first_comment" slot (the engine doesn't yet support a
    // per-platform map). Pick the same key the UI uses for `sameForAll`.
    const firstCommentText = firstCommentByPlatform?.__all
      ?? (platforms.length > 0 ? firstCommentByPlatform?.[platforms[0]!] : undefined);

    const idToken = await getIdToken();
    if (!idToken) {
      toast({
        title: t("signInRequired"),
        description: t("signInDescription"),
        tone: "error",
      });
      return { ok: false };
    }

    // ── Step 1: download source image into a File ─────────────────────
    let sourceFile: File;
    try {
      sourceFile = await fetchAsFile(
        sourceMediaUrl,
        `source_${Date.now()}.jpg`,
        "image/jpeg"
      );
    } catch (err) {
      toast({
        title: t("outpaint.cantReadSource"),
        description: err instanceof Error ? err.message : "Download failed",
        tone: "error",
      });
      return { ok: false };
    }

    // ── Step 2: start outpaint job ─────────────────────────────────────
    setOutpaintPhase("generating");
    let jobId: string;
    let totalVariants: number | undefined;
    try {
      const form = new FormData();
      form.append("image", sourceFile, sourceFile.name);
      form.append("platforms", JSON.stringify(platforms));
      const startRes = await fetch("/api/images/outpaint", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          ...getOverrideHeaders(),
        },
        body: form,
      });
      const startData = (await startRes.json().catch(() => ({}))) as {
        jobId?: string;
        estimatedVariants?: number;
        error?: string;
      };
      if (!startRes.ok || !startData.jobId) {
        toast({
          title: t("outpaint.cantStartAI"),
          description: startData.error ?? `HTTP ${startRes.status}`,
          tone: "error",
        });
        return { ok: false };
      }
      jobId = startData.jobId;
      totalVariants = startData.estimatedVariants;
    } catch (err) {
      toast({
        title: scheduledAt ? t("scheduleFailed") : t("publishFailed"),
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
      return { ok: false };
    }

    const generateToastId = toast({
      title: t("outpaint.generating"),
      description: totalVariants
        ? t("outpaint.generatingDesc", { count: totalVariants })
        : t("outpaint.generatingDescNoCount"),
      tone: "info",
    });

    // ── Step 3: poll until complete (or timeout) ───────────────────────
    const POLL_INTERVAL_MS = 2_000;
    const POLL_TIMEOUT_MS = 120_000;
    const pollDeadline = Date.now() + POLL_TIMEOUT_MS;
    let lastVariantsCount = 0;
    let pollResult: { status: string; variants?: Array<{ status: string; ratioKey?: string }> } | null =
      null;

    while (Date.now() < pollDeadline) {
      await sleep(POLL_INTERVAL_MS);
      let pollRes: Response;
      try {
        pollRes = await fetch(`/api/images/outpaint/${encodeURIComponent(jobId)}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            ...getOverrideHeaders(),
          },
        });
      } catch {
        continue;
      }
      const pollData = (await pollRes.json().catch(() => ({}))) as {
        status?: string;
        variants?: Array<{ status: string; ratioKey?: string }>;
        error?: string;
      };
      if (!pollRes.ok) {
        // 404 = engine forgot the job (server restart); abort.
        if (pollRes.status === 404) {
          dismiss(generateToastId);
          toast({
            title: t("outpaint.engineJobLost"),
            description: t("outpaint.engineJobLostDesc"),
            tone: "error",
          });
          return { ok: false };
        }
        continue;
      }
      pollResult = {
        status: pollData.status ?? "unknown",
        variants: pollData.variants,
      };
      lastVariantsCount = (pollData.variants ?? []).filter(
        (v) => v.status === "complete"
      ).length;
      const status = pollData.status;
      if (status === "complete" || status === "delivered") break;
      if (status === "failed" || status === "generation_failed") {
        dismiss(generateToastId);
        toast({
          title: t("outpaint.generationFailed"),
          description: pollData.error ?? "The engine couldn't complete all variants.",
          tone: "error",
        });
        return { ok: false };
      }
    }

    if (!pollResult || pollResult.status !== "complete") {
      dismiss(generateToastId);
      toast({
        title: t("outpaint.tookTooLong"),
        description: t("outpaint.tookTooLongDesc"),
        tone: "error",
      });
      return { ok: false };
    }
    dismiss(generateToastId);

    // ── Step 4: deliver per platform via upload-post.com ──────────────
    setOutpaintPhase("delivering");
    const deliverToastId = toast({
      title: t("outpaint.delivering"),
      description: t("outpaint.deliveringDesc", { count: lastVariantsCount, platforms: platforms.length }),
      tone: "info",
    });

    let deliverData: {
      ok?: boolean;
      postId?: string;
      status?: string;
      totals?: { total: number; succeeded: number; failed: number };
      results?: Array<{
        platform: string;
        status: string;
        error?: { message: string } | null;
      }>;
      error?: string;
    };
    try {
      const deliverRes = await fetch("/api/images/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          ...getOverrideHeaders(),
        },
        body: JSON.stringify({
          jobId,
          caption,
          hashtags: extractHashtags(caption),
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
          firstComment: firstCommentText,
          firstCommentByPlatform,
          quoteTweetUrl,
          community,
          tagUsers,
          feedType,
          altTextByPlatform,
          mediaType,
          sourceMediaUrl,
        }),
      });
      deliverData = (await deliverRes.json().catch(() => ({}))) as typeof deliverData;
      if (!deliverRes.ok || !deliverData.ok) {
        dismiss(deliverToastId);
        toast({
          title: scheduledAt ? t("scheduleFailed") : t("publishFailed"),
          description:
            deliverData.error ??
            (deliverData.totals
              ? `${deliverData.totals.failed}/${deliverData.totals.total} platforms failed`
              : `HTTP ${deliverRes.status}`),
          tone: "error",
        });
        return { ok: false };
      }
    } catch (err) {
      dismiss(deliverToastId);
      toast({
        title: scheduledAt ? "Schedule failed" : "Publish failed",
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
      return { ok: false };
    }
    dismiss(deliverToastId);

    const totals = deliverData.totals ?? { total: 0, succeeded: 0, failed: 0 };
    const failedPlatforms = (deliverData.results ?? [])
      .filter((r) => r.status === "failed")
      .map((r) => `${r.platform}: ${r.error?.message ?? "unknown"}`)
      .slice(0, 3);

    if (totals.failed === 0) {
      toast({
        title: scheduledAt ? t("scheduleSuccess") : t("publishSuccess"),
        description: t("outpaint.allVariants", { count: totals.total }),
        tone: "success",
      });
    } else if (totals.succeeded > 0) {
      toast({
        title: t("outpaint.partial", { succeeded: totals.succeeded, total: totals.total }),
        description: failedPlatforms[0] ?? "",
        tone: "warning",
      });
    } else {
      toast({
        title: t("publishFailed"),
        description: failedPlatforms[0] ?? "All platforms failed",
        tone: "error",
      });
      return { ok: false };
    }

    return { ok: true, postId: deliverData.postId, results: deliverData.results };
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
      const mimeType = file.type || (kind === "video" ? "video/mp4" : "image/jpeg");
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
          mimeType,
          // Videos: start as metadata-loading so the validator doesn't default duration to 0
          metadataLoaded: kind === "video" ? false : undefined,
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
      title: t("media.filesAdded", { count: newItems.length }),
      description: t("media.uploading"),
      tone: "info",
    });

    // Probe video durations in parallel with uploads using HTMLVideoElement
    for (const { item } of built) {
      if (item.kind === "video") {
        probeVideoDuration(item.url, (dur, err) => {
          setMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? { ...m, durationSec: dur, metadataLoaded: true, metadataError: err }
                : m
            )
          );
        });
        extractVideoThumbnail(item.url).then((thumb) => {
          if (thumb) {
            setFrameCoverUrl((prev) => prev || thumb);
          }
        }).catch(() => undefined);
      }
    }

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
          toast({
            title: "Media upload failed",
            description: msg,
            tone: "error",
          });
        }
      })
    );
  }

  function removeMedia(id: string) {
    const target = mediaItems.find((m) => m.id === id);
    if (target?.url) URL.revokeObjectURL(target.url);
    if (target?.storedPath) {
      // Best-effort delete on Bunny. If it fails we still drop the row
      // locally — an orphan in the user's storage folder isn't harmful —
      // but we surface a warning so the user can retry from the media
      // library if they care about storage hygiene.
      void fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({ storedPath: target.storedPath }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = (await res.json().catch(() => null)) as { error?: string } | null;
            toast({
              title: "Failed to delete file",
              description: err?.error ?? "File removed locally, but CDN cleanup failed.",
              tone: "warning",
            });
          }
        })
        .catch(() => {
          toast({
            title: "Failed to delete file",
            description: "File removed locally, but CDN cleanup failed.",
            tone: "warning",
          });
        });
    }
    setMediaItems((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const next = prev.filter((m) => m.id !== id);
      if (idx <= activeMedia && activeMedia > 0) setActiveMedia(activeMedia - 1);
      else if (activeMedia >= next.length) setActiveMedia(Math.max(0, next.length - 1));
      return next;
    });
  }

  async function handleCarouselFiles(files: File[]) {
    const remaining = Math.max(0, 10 - carouselItems.length);
    const accepted = files.slice(0, remaining);
    const built: CarouselItem[] = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      const kind = file.type.startsWith("video/") ? "video" : "image";
      const mimeType = file.type || (kind === "video" ? "video/mp4" : "image/jpeg");
      return {
        id: `carousel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl,
        kind,
        mimeType,
        durationSec: undefined,
        metadataLoaded: kind === "video" ? false : undefined,
        metadataError: undefined,
        uploadStatus: "uploading",
        uploadProgress: 0,
      };
    });

    if (built.length === 0) return;
    setCarouselItems((prev) => [...prev, ...built]);

    toast({
      title: t("media.filesAdded", { count: built.length }),
      description: t("media.uploading"),
      tone: "info",
    });

    // Probe video durations concurrently without state collisions
    for (const item of built) {
      if (item.kind === "video") {
        probeVideoDuration(item.previewUrl, (dur, err) => {
          setCarouselItems((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, durationSec: dur, metadataLoaded: true, metadataError: err } : c))
          );
        });
      }
    }

    // Upload in parallel
    await Promise.all(
      built.map(async (item) => {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress = Math.min(90, progress + 10);
          setCarouselItems((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, uploadProgress: progress } : c))
          );
        }, 300);

        try {
          const fd = new FormData();
          fd.append("file", item.file);
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
          clearInterval(progressInterval);
          if (!res.ok || !data.ok || !data.url) {
            throw new Error(data.error ?? `HTTP ${res.status}`);
          }
          setCarouselItems((prev) =>
            prev.map((c) =>
              c.id === item.id
                ? { ...c, cdnUrl: data.url, uploadStatus: "ready", uploadProgress: 100 }
                : c
            )
          );
        } catch (err) {
          clearInterval(progressInterval);
          setCarouselItems((prev) =>
            prev.map((c) =>
              c.id === item.id ? { ...c, uploadStatus: "error" } : c
            )
          );
        }
      })
    );
  }

  async function handleTrialReelFile(file: File) {
    const mimeType = file.type || "video/mp4";
    const previewUrl = URL.createObjectURL(file);
    const item: TrialReelFile = {
      file,
      previewUrl,
      mimeType,
      durationSec: undefined,
      metadataLoaded: false,
      metadataError: undefined,
      uploadStatus: "uploading",
      uploadProgress: 0,
    };
    setTrialReelFile(item);

    // Probe duration with HTMLVideoElement
    probeVideoDuration(previewUrl, (dur, err) => {
      setTrialReelFile((prev) => (prev ? { ...prev, durationSec: dur, metadataLoaded: true, metadataError: err } : null));
    });
    extractVideoThumbnail(previewUrl).then((thumb) => {
      if (thumb) {
        setFrameCoverUrl((prev) => prev || thumb);
      }
    }).catch(() => undefined);

    toast({
      title: "Reel added",
      description: "Uploading video to Bunny CDN…",
      tone: "info",
    });

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(90, progress + 8);
      setTrialReelFile((prev) => (prev ? { ...prev, uploadProgress: progress } : null));
    }, 400);

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
      clearInterval(progressInterval);
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setTrialReelFile((prev) =>
        prev
          ? {
              ...prev,
              cdnUrl: data.url,
              uploadStatus: "ready",
              uploadProgress: 100,
            }
          : null
      );
    } catch (err) {
      clearInterval(progressInterval);
      setTrialReelFile((prev) => (prev ? { ...prev, uploadStatus: "error" } : null));
    }
  }

  async function handleDocumentFile(file: File, pageCount?: number | null) {
    const item: DocumentFile = {
      file,
      pageCount,
      uploadStatus: "uploading",
      uploadProgress: 0,
    };
    setDocumentFile(item);

    toast({
      title: "Document added",
      description: "Uploading document to Bunny CDN…",
      tone: "info",
    });

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(90, progress + 12);
      setDocumentFile((prev) => (prev ? { ...prev, uploadProgress: progress } : null));
    }, 250);

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
      clearInterval(progressInterval);
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setDocumentFile((prev) =>
        prev
          ? {
              ...prev,
              cdnUrl: data.url,
              uploadStatus: "ready",
              uploadProgress: 100,
            }
          : null
      );
    } catch (err) {
      clearInterval(progressInterval);
      setDocumentFile((prev) => (prev ? { ...prev, uploadStatus: "error" } : null));
    }
  }

  async function handleGenerateCaptions(opts: {
    tone: string;
    includeHashtags: boolean;
    useEmojis: boolean;
    extra: string;
  }) {
    if (selectedPlatforms.length === 0) {
      toast({ title: t("pickAccount"), tone: "warning" });
      return;
    }

    let rawImageUrl: string | null = null;
    let videoTitle: string | null = null;

    if (composerMode === "carousel") {
      const imgItem = carouselItems.find((c) => c.kind === "image" && (c.cdnUrl || c.previewUrl));
      if (imgItem) {
        rawImageUrl = imgItem.cdnUrl || imgItem.previewUrl;
      } else {
        const vidItem = carouselItems.find((c) => c.kind === "video");
        if (vidItem) {
          videoTitle = vidItem.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        }
      }
    } else if (composerMode === "trial_reel") {
      if (trialReelFile) {
        videoTitle = trialReelFile.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      }
    } else if (composerMode === "document") {
      if (documentFile) {
        videoTitle = documentTitle || documentFile.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      }
    } else {
      const active = mediaItems[activeMedia];
      if (active?.kind === "image") {
        rawImageUrl = active.cdnUrl || active.url;
      } else if (active?.kind === "video") {
        videoTitle = active.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      }
    }

    let imageUrl: string | null = null;
    if (rawImageUrl) {
      if (rawImageUrl.startsWith("blob:")) {
        // Convert blob URL to base64 data URI so Groq can read it
        try {
          const response = await fetch(rawImageUrl);
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
        imageUrl = rawImageUrl;
      }
    }

    if (!imageUrl && !videoTitle) {
      toast({ title: t("uploadMedia"), tone: "warning" });
      return;
    }

    setAiGenerating(true);
    const captionPlatforms = selectedPlatforms.filter((platform) => !(onlyImage && platform.videoOnly));
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
          platforms: captionPlatforms.map((p) => ({
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
      const captionsByPlatform = Object.fromEntries(
        captionPlatforms.map((p) => [p.id, fitCaptionForPlatform(caption, p.id)])
      ) as Record<PlatformId, string>;
      const adapted = captionPlatforms.filter((p) => captionsByPlatform[p.id] !== caption);

      if (sameForAll && adapted.length === 0) {
        setCaptions((prev) => ({ ...prev, __all: caption }));
      } else {
        // Platform-safe variants need separate fields so the user can review
        // the shortened X/Threads copies before publishing.
        if (sameForAll) setSameForAll(false);
        setCaptions((prev) => ({ ...prev, ...captionsByPlatform }));
      }
      toast({
        title: t("captionsGenerated"),
        description: adapted.length > 0
          ? `Applied with ${adapted.length} platform-safe version${adapted.length === 1 ? "" : "s"}`
          : `Applied to ${captionPlatforms.length} account${captionPlatforms.length === 1 ? "" : "s"}`,
        tone: "success",
      });
      setAiDialogOpen(false);
    } catch (err) {
      toast({
        title: t("outpaint.cantStartAI"),
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

  function firstCommentFor(id: PlatformId): string {
    if (sameForAll) return firstComments.__all ?? "";
    return firstComments[id] ?? "";
  }

  function setFirstCommentFor(id: PlatformId, v: string) {
    setFirstComments((prev) => ({ ...prev, [sameForAll ? "__all" : id]: v }));
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
    setFirstComments((prev) => {
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
    carouselItems.length > 0 ||
    !!trialReelFile ||
    !!documentFile ||
    selected.size > 0 ||
    Object.values(captions).some((v) => v.trim().length > 0);

  const canSaveDraft = hasAnyContent || !!draftId;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">{t("pageTitle")}</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <PlatformTileBar
            selected={selected}
            onToggle={toggleAccount}
            lockedPlatforms={composerMode === "trial_reel" ? new Set<PlatformId>(["instagram"]) : composerMode === "document" ? new Set<PlatformId>(["linkedin"]) : undefined}
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
            onClick={deselectAll}
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            Deselect All
          </button>
          <button
            type="button"
            onClick={startOver}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 h-9 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="size-3.5" />
            {t("startOver")}
          </button>
        </div>
      </div>

      {/* 2-column layout: left (Media + Accounts + Cover) | right (Captions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column: Mode selector + Media + Accounts + CoverSections */}
        <div className="space-y-4">

          {/* ── Content Mode Selector ── */}
          <ComposerModeSelector
            mode={composerMode}
            onChange={(m) => {
              setComposerMode(m);
              // Auto-lock platform selection based on mode
              if (m === "trial_reel") {
                setSelected(new Set(["instagram"]));
              } else if (m === "document") {
                setSelected(new Set(["linkedin"]));
              } else if (m === "carousel") {
                // keep current selection but remove incompatible ones
                setSelected((prev) => {
                  const compatible = new Set(["instagram", "facebook", "threads"]);
                  return new Set([...prev].filter((id) => compatible.has(id)));
                });
              } else {
                // standard — restore platforms the workspace actually has connected
                // (fall back to all when accounts haven't loaded yet so we don't lock out
                // the user on a slow /api/social-accounts/list response).
                const fallback = new Set(PLATFORMS.map((p) => p.id));
                const restored = connectedPlatforms.size > 0 ? connectedPlatforms : fallback;
                setSelected(new Set(restored));
              }
            }}
          />

          {/* ── Media Card (switches by mode) ── */}
          {composerMode === "standard" ? (
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
              onOpenTagUsers={() => {
                tagUsersRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                const input = tagUsersRef.current?.querySelector("input");
                input?.focus();
              }}
              customCoverUrl={customCoverUrl}
              frameCoverUrl={frameCoverUrl}
              onOpenCoverModal={() => setCoverModalOpen(true)}
              onPickCustomCover={() => customCoverInputRef.current?.click()}
              onRemoveCustomCover={() => {
                setCustomCoverUrl(null);
                toast({ title: t("cover.customRemoved"), tone: "info" });
              }}
            />
          ) : composerMode === "carousel" ? (
            <CarouselMediaCard
              items={carouselItems}
              onAddFiles={handleCarouselFiles}
              onRemove={(id) => {
                setCarouselItems((prev) => {
                  const item = prev.find((i) => i.id === id);
                  if (item) URL.revokeObjectURL(item.previewUrl);
                  return prev.filter((i) => i.id !== id);
                });
              }}
              onReorder={(from, to) => {
                setCarouselItems((prev) => {
                  const next = [...prev];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  return next;
                });
              }}
            />
          ) : composerMode === "trial_reel" ? (
            <TrialReelCard
              videoFile={trialReelFile}
              trialMode={trialMode}
              onVideoFile={handleTrialReelFile}
              onRemoveVideo={() => {
                if (trialReelFile) URL.revokeObjectURL(trialReelFile.previewUrl);
                setTrialReelFile(null);
              }}
              onTrialModeChange={setTrialMode}
            />
          ) : (
            <DocumentUploadCard
              docFile={documentFile}
              docTitle={documentTitle}
              onDocFile={handleDocumentFile}
              onRemoveDoc={() => setDocumentFile(null)}
              onTitleChange={setDocumentTitle}
            />
          )}

          {/* ── Accounts Card ── */}
          <AccountsCard
            selected={selected}
            onToggle={toggleAccount}
            onSelectAll={composerMode === "standard" ? selectAll : undefined}
            onDeselectAll={deselectAll}
            remember={remember}
            onRememberChange={handleRememberChange}
            feedType={feedType}
            onFeedTypeChange={setFeedType}
            onlyImage={onlyImage}
            composerMode={composerMode}
            accountsError={accountsError}
            onRetry={retryAccountsLoad}
          />

          {isVideoActive && composerMode === "standard" ? (
            <CoverSections
              frameCoverUrl={frameCoverUrl}
              customCoverUrl={customCoverUrl}
              onOpenFrameModal={() => setCoverModalOpen(true)}
              onPickCustomCover={() => customCoverInputRef.current?.click()}
              onRemoveCustomCover={() => {
                setCustomCoverUrl(null);
                toast({ title: t("cover.customRemoved"), tone: "info" });
              }}
            />
          ) : null}
        </div>

        {/* Right column: Captions + Metadata Rules */}
        <CaptionsCard
          platforms={selectedPlatforms}
          sameForAll={sameForAll}
          onSameForAllChange={handleSameForAllChange}
          getCaption={captionFor}
          setCaption={setCaptionFor}
          getFirstComment={firstCommentFor}
          setFirstComment={setFirstCommentFor}
          onGenerate={() => setAiDialogOpen(true)}
          community={community}
          onCommunityChange={setCommunity}
          quoteTweet={quoteTweet}
          onQuoteTweetChange={setQuoteTweet}
          tagUsers={tagUsers}
          onTagUsersChange={setTagUsers}
          showTagUsers={mediaItems.length > 0 || composerMode !== "standard"}
          hasVideo={hasVideo}
          toast={toast}
          getAdvancedOptions={getAdvancedOptions}
          setAdvancedOptions={setAdvancedOptions}
          mediaKind={composerMediaKind}
          metadataRules={metadataRules}
          onMetadataRulesChange={setMetadataRules}
          rulesOpen={rulesOpen}
          onRulesOpenChange={setRulesOpen}
          sampleCaption={captionForCurrent()}
          tagUsersRef={tagUsersRef}
          selectOptions={{
            pinterest_board_id: destinationOptions.boards,
            facebook_page_id: destinationOptions.pages,
          }}
        />
      </div>

      {/* Publish readiness panel — full view (Feature 2) */}
      {requirementsOpen ? (
        <div className="mt-4">
          <RequirementsPanel
            report={readinessReport}
            platformNames={Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name])) as Record<PlatformId, string>}
            onClose={() => setRequirementsOpen(false)}
          />
        </div>
      ) : null}

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 w-full bg-background border-t mt-8 -mx-6 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <button
            type="button"
            disabled={!canSaveDraft || submitting}
            onClick={handleSaveDraft}
            title={!canSaveDraft ? "Add a caption, media or select a platform to save" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="size-4" />
            {draftId ? t("draftSaved") : t("saveDraft")}
          </button>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {readinessReport.overall === "blocked" || readinessReport.overall === "warning" ? (
              <button
                type="button"
                onClick={() => setRequirementsOpen(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                title="View platform requirements"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
                {readinessReport.blockedCount} blocked
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Ready
              </span>
            )}
            <button
              type="button"
              disabled={!hasAnyContent || submitting || readinessReport.overall === "blocked"}
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submissionMode === "scheduling" ? "Scheduling…" : t("schedule")}
            </button>
            <button
              type="button"
              disabled={!hasAnyContent || submitting || readinessReport.overall === "blocked"}
              onClick={() => publishPost(null)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-3.5" />
              {submissionMode === "publishing" ? t("publishing") : t("publishNow")}
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
            : composerMode === "carousel" && carouselItems.some((c) => c.kind === "image")
              ? (carouselItems.find((c) => c.kind === "image")!.cdnUrl || carouselItems.find((c) => c.kind === "image")!.previewUrl)
              : null
        }
        videoTitle={
          activeMediaItem?.kind === "video"
            ? activeMediaItem.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
            : composerMode === "trial_reel" && trialReelFile
              ? trialReelFile.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
              : composerMode === "carousel" && carouselItems.some((c) => c.kind === "video")
                ? carouselItems.find((c) => c.kind === "video")!.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
                : composerMode === "document" && documentFile
                  ? documentTitle || documentFile.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
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
        onApply={async (dataUrl) => {
          await applyFrameCover(dataUrl);
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
        onApply={async (dataUrl) => {
          if (!activeMediaItem || activeMediaItem.kind !== "image") return;
          await applyCroppedImage(dataUrl, activeMediaItem.id ?? "primary");
        }}
      />

      <AltTextModal
        open={altTextModalOpen}
        onClose={() => setAltTextModalOpen(false)}
        imageUrl={activeMediaItem?.kind === "image" ? activeMediaItem.url : null}
        initialValue={
          activeMediaItem
            ? altTexts[activeMediaItem.id ?? "primary"] ?? ""
            : ""
        }
        onSave={(value) => {
          if (activeMediaItem) {
            const key = activeMediaItem.id ?? "primary";
            setAltTexts((prev) => {
              const next = { ...prev };
              if (value) next[key] = value;
              else delete next[key];
              return next;
            });
          }
          toast({
            title: value ? t("altTextSaved") : t("altTextCleared"),
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
          toast({ title: t("cover.customUploaded"), tone: "success" });
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
  const t = useTranslations("createPost");
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
              <h3 className="text-lg font-semibold leading-none">{t("media.title")}</h3>
              <span className="text-xs font-normal text-zinc-500/70 ml-1">{t("media.optional")}</span>
            </div>
            {active ? (
              <div className="flex items-center flex-wrap gap-2">
                <Pill icon={<ImageIcon className="size-3" />} label={active.kind === "image" ? t("media.image") : t("media.video")} />
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
            onFiles={onFiles}
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
  onFiles,
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
  onFiles: (files: File[]) => void;
  atMax: boolean;
  onUnsplash: () => void;
  onGenerateAI: () => void;
  onCanva: () => void;
  onDrive: () => void;
  onDropbox: () => void;
}) {
  const t = useTranslations("createPost");
  const tabs: { id: MediaTab; label: string }[] = [
    { id: "media", label: t("media.tabMedia") },
    { id: "paste", label: t("media.tabPaste") },
  ];

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) {
          files.push(f);
        }
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      onFiles(files);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!atMax) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onPaste={handlePaste}
      onClick={() => !atMax && onPickFiles()}
      role="button"
      tabIndex={0}
      aria-disabled={atMax}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400",
        dragging ? "border-blue-500 bg-blue-50/30" : "border-zinc-300 hover:bg-zinc-50",
        atMax && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <div className="absolute top-2 right-2 inline-flex items-center rounded-md border border-zinc-300 bg-white/80 p-0.5 gap-0.5">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTabChange(tabItem.id);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
              tab === tabItem.id ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[160px] gap-2">
        <ImageIcon className="size-6 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-900">
          {tab === "paste" ? t("media.dragDropPaste") : t("media.dragDrop")}
        </p>
        <p className="text-xs text-zinc-500">{t("media.clickBrowse")}</p>

        <div className="mt-3 flex items-center flex-wrap justify-center gap-2">
          <span className="text-xs text-zinc-500">{t("media.importFrom")}</span>
          <ImportButton label={t("media.generateAI")} tone="violet" onClick={onGenerateAI} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnsplash?.(); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-700 shadow-sm"
          >
            <BrandIcons.unsplash size={14} className="shrink-0 text-black dark:text-white fill-current" />
            {t("media.unsplash")}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCanva?.(); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-700 shadow-sm"
          >
            <BrandIcons.canva size={16} className="shrink-0" />
            {t("media.canva")}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDrive?.(); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-700 shadow-sm"
          >
            <BrandIcons.googledrive size={14} className="shrink-0" />
            {t("media.googleDrive")}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDropbox?.(); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-700 shadow-sm"
          >
            <BrandIcons.dropbox size={14} className="shrink-0 text-[#0061FF] fill-current" />
            {t("media.dropbox")}
          </button>
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
  const t = useTranslations("createPost");
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
          label={t("media.crop")}
          onClick={onOpenCrop}
          disabled={!isImage}
        />
        <MediaAction
          icon={<FileText className="size-3.5" />}
          label={t("media.altText")}
          onClick={onOpenAltText}
          disabled={!isImage}
        />
        <MediaAction
          icon={<AtSign className="size-3.5" />}
          label={t("media.tagUsers", { count: 0 })}
          onClick={onOpenTagUsers}
        />
        <MediaAction
          icon={<Users className="size-3.5" />}
          label={t("media.collaborators", { count: collaboratorsCount })}
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

/**
 * Probe video duration using HTMLVideoElement. Prefer over `new Audio()` for
 * reliable metadata events on mp4/quicktime. Cleans up listeners and src after.
 */
async function extractVideoThumbnail(url: string, atSec = 0.5): Promise<string | null> {
  if (typeof document === "undefined" || !url) return null;
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    (video as unknown as Record<string, unknown>).playsInline = true;
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      try {
        video.src = "";
        video.remove();
      } catch {}
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4000);

    const onLoaded = () => {
      try {
        video.currentTime = Math.min(atSec, Math.max(0.1, (video.duration || 1) / 2));
      } catch {
        onSeeked();
      }
    };

    const onSeeked = () => {
      try {
        if (!video.videoWidth) {
          cleanup();
          resolve(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth, 800);
        canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    const onError = () => {
      cleanup();
      resolve(null);
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.src = url;
  });
}

function probeVideoDuration(url: string, cb: (durationSec?: number, error?: string) => void): void {
  if (typeof document === "undefined") { cb(undefined, "no_document"); return; }
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  (video as unknown as Record<string, unknown>).playsInline = true;
  let finished = false;

  const cleanup = () => {
    if (finished) return;
    finished = true;
    video.removeEventListener("loadedmetadata", onLoaded);
    video.removeEventListener("error", onError);
    clearTimeout(fallbackTimer);
    try {
      (video as any).src = "";
      video.remove();
    } catch {}
  };
  const onLoaded = () => {
    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : undefined;
    cleanup();
    cb(dur, undefined);
  };
  const onError = () => {
    cleanup();
    cb(undefined, "metadata_failed");
  };

  const fallbackTimer = setTimeout(() => {
    if (finished) return;
    if (isFinite(video.duration) && video.duration > 0) {
      onLoaded();
    } else {
      cleanup();
      cb(undefined, "metadata_timeout");
    }
  }, 4000);

  video.addEventListener("loadedmetadata", onLoaded);
  video.addEventListener("error", onError);
  video.src = url;

  if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
    onLoaded();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a remote image URL and return it as a File so it can be appended
 * to a multipart/form-data request (the engine expects a real file field).
 */
async function fetchAsFile(
  url: string,
  fallbackName: string,
  fallbackMime: string
): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const mime = blob.type || fallbackMime;
  const name = guessFileName(url, fallbackName, mime);
  return new File([blob], name, { type: mime });
}

/**
 * Convert a canvas data URL into a File so the upload route can ingest it.
 * Used by the CropModal (image crops) and the CoverImageModal (video frame
 * captures) to ferry in-browser renderings into the CDN pipeline.
 */
function dataUrlToFile(dataUrl: string, fallbackName: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)(?:;base64)?/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const isBase64 = /;base64/.test(meta);
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
    ? "webp"
    : mime.includes("gif")
    ? "gif"
    : "jpg";
  const name = /\.([a-z0-9]{2,5})$/i.test(fallbackName)
    ? fallbackName
    : `${fallbackName.replace(/\.[^.]+$/, "")}.${ext}`;
  if (isBase64) {
    const binary = atob(b64 ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  }
  const decoded = decodeURIComponent(b64 ?? "");
  const bytes = new TextEncoder().encode(decoded);
  return new File([bytes], name, { type: mime });
}

function guessFileName(url: string, fallback: string, mime: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return last;
  } catch {
    /* not a valid URL — fall through */
  }
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
    ? "webp"
    : mime.includes("gif")
    ? "gif"
    : "jpg";
  return `${fallback.replace(/\.[^.]+$/, "")}.${ext}`;
}

/**
 * Pull hashtags out of a caption. Matches the same split-on-whitespace
 * logic that the deliver route uses, so the persisted hashtag list stays
 * consistent with what the publisher actually attached.
 */
function extractHashtags(caption: string): string {
  return caption
    .split(/\s+/)
    .filter((t) => t.startsWith("#") && t.length > 1)
    .join(" ");
}

// =========================
// Accounts card
// =========================

interface AccountsCardProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll?: () => void;
  onDeselectAll: () => void;
  remember: boolean;
  onRememberChange: (b: boolean) => void;
  feedType: "feed" | "story";
  onFeedTypeChange: (t: "feed" | "story") => void;
  onlyImage: boolean;
  composerMode?: ComposerMode;
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
  const t = useTranslations("createPost");
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Video Frame Cover */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold">{t("cover.frameTitle")}</h4>
            <button
              type="button"
              aria-label="About Video Frame Cover"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Info className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed min-h-[36px]">
            {t("cover.frameDesc")}
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
              {t("cover.changeFrame")}
            </button>
          </div>
        </div>

        {/* Custom Cover Image */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold">{t("cover.customTitle")}</h4>
            <button
              type="button"
              aria-label="About Custom Cover Image"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Info className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed min-h-[36px]">
            {t("cover.customDesc")}
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
                {t("cover.remove")}
              </button>
            ) : (
              <button
                type="button"
                onClick={onPickCustomCover}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                <Upload className="size-3.5" />
                {t("cover.uploadCustom")}
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
  composerMode = "standard",
  accountsError = false,
  onRetry,
}: {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll?: () => void;
  onDeselectAll: () => void;
  remember: boolean;
  onRememberChange: (v: boolean) => void;
  feedType: "feed" | "story";
  onFeedTypeChange: (v: "feed" | "story") => void;
  onlyImage: boolean;
  composerMode?: string;
  accountsError?: boolean;
  onRetry?: () => void;
}) {
  const t = useTranslations("createPost");
  const hasSelection = selected.size > 0;

  // Keep every supported platform visible so Select All can include the full
  // publishing catalog, even when an account has not returned a handle yet.
  const visiblePlatforms = PLATFORMS;

  const storyAvailable = useMemo(() => {
    return visiblePlatforms.some((p) => selected.has(p.id) && (p.id === "instagram" || p.id === "facebook"));
  }, [selected, visiblePlatforms]);

  // Platform compatibility per mode
  const CAROUSEL_COMPATIBLE = new Set(["instagram", "facebook", "threads"]);
  function isPlatformLocked(id: PlatformId): { locked: boolean; reason: string | null } {
    if (composerMode === "trial_reel" && id !== "instagram") {
      return { locked: true, reason: t("accounts.trialReelsOnly") };
    }
    if (composerMode === "document" && id !== "linkedin") {
      return { locked: true, reason: t("accounts.documentsOnly") };
    }
    if (composerMode === "carousel" && !CAROUSEL_COMPATIBLE.has(id)) {
      return { locked: true, reason: t("accounts.carouselUnsupported") };
    }
    return { locked: false, reason: null };
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StepCircle n={2} />
            <h3 className="text-lg font-semibold leading-none">{t("accounts.title")}</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => onRememberChange(e.target.checked)}
                className="size-4 rounded-sm border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              />
              {t("accounts.remember")}
            </label>
            {/* Control B: disabled until account settings route exists */}
            <button
              type="button"
              disabled
              aria-label="Account settings (coming soon)"
              title="Account settings (coming soon)"
              className="size-7 inline-flex items-center justify-center rounded-md text-zinc-300 cursor-not-allowed"
            >
              <Settings className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Control F: disabled in modes that lock platform selection */}
            <button
              type="button"
              onClick={onSelectAll}
              disabled={!onSelectAll}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("accounts.selectAll")}
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={!hasSelection}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("accounts.deselectAll")}
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto -mx-1 px-1">
          {/* BUG 6: Show error state with retry button */}
          {accountsError ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <p className="text-sm font-medium text-red-600">Failed to load connected accounts</p>
              <p className="text-xs text-zinc-500">Showing all platforms as fallback.</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-7 text-xs font-medium hover:bg-zinc-50"
                >
                  Retry
                </button>
              )}
            </div>
          ) : visiblePlatforms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium text-zinc-700">No connected accounts</p>
              <p className="text-xs text-zinc-500 mt-1">Connect social accounts in the Accounts page first.</p>
            </div>
          ) : null}
          {visiblePlatforms.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {visiblePlatforms.map((p) => {
              const isSel = selected.has(p.id);
              const disabledByMedia = onlyImage && p.videoOnly;
              const { locked: lockedByMode, reason: modeReason } = isPlatformLocked(p.id);
              const disabledReason = lockedByMode ? modeReason : (disabledByMedia ? t("onlyVideoSupported") : null);
              const disabled = disabledByMedia || lockedByMode;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !disabled && onToggle(p.id)}
                  disabled={disabled}
                  title={disabledReason ?? undefined}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-accent cursor-pointer"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSel && !disabled}
                    disabled={disabled}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4 rounded-sm border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <PlatformAvatar platform={p} size={32} className={cn(disabled && "grayscale")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.handle || p.name}</p>
                    {disabledReason ? (
                      <p className="text-[10px] italic text-zinc-400">{disabledReason}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {hasSelection ? (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">{t("accounts.postIn")}</span>
              {/* Control E: radio semantics for feed/story — mutually exclusive */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="feedType"
                  value="feed"
                  checked={feedType === "feed"}
                  onChange={() => onFeedTypeChange("feed")}
                  className="size-4 border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                />
                {t("accounts.feed")}
              </label>
              <label
                className={cn(
                  "inline-flex items-center gap-1.5",
                  storyAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <input
                  type="radio"
                  name="feedType"
                  value="story"
                  checked={feedType === "story"}
                  onChange={() => onFeedTypeChange("story")}
                  disabled={!storyAvailable}
                  className="size-4 border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                />
                {t("accounts.story")}
              </label>
            </div>
            {!storyAvailable ? (
              <p className="text-xs text-zinc-500">{t("accounts.storiesNote")}</p>
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
  getFirstComment: (id: PlatformId) => string;
  setFirstComment: (id: PlatformId, v: string) => void;
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
  getAdvancedOptions: (id: PlatformId) => PlatformAdvancedOptions;
  setAdvancedOptions: (id: PlatformId, next: PlatformAdvancedOptions) => void;
  mediaKind: MediaKind;
  metadataRules: MetadataRules;
  onMetadataRulesChange: (rules: MetadataRules) => void;
  rulesOpen: boolean;
  onRulesOpenChange: (open: boolean) => void;
  sampleCaption?: string;
  tagUsersRef?: React.RefObject<HTMLDivElement | null>;
  selectOptions: Partial<Record<string, Array<{ value: string; label: string }>>>;
}

function CaptionsCard({
  platforms,
  sameForAll,
  onSameForAllChange,
  getCaption,
  setCaption,
  getFirstComment,
  setFirstComment,
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
  getAdvancedOptions,
  setAdvancedOptions,
  mediaKind,
  metadataRules,
  onMetadataRulesChange,
  rulesOpen,
  onRulesOpenChange,
  sampleCaption = "",
  tagUsersRef,
  selectOptions,
}: CaptionsCardProps) {
  const t = useTranslations("createPost");
  const hasActiveRules = metadataRules.enabled && (metadataRules.hashtags.length > 0 || metadataRules.ctaLine);

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <StepCircle n={3} />
            <h3 className="text-lg font-semibold leading-none">{t("captions.title")}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Campaign Rules toggle */}
            <button
              type="button"
              onClick={() => onRulesOpenChange(!rulesOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-3 h-9 text-xs font-medium transition-all duration-200",
                rulesOpen || hasActiveRules
                  ? "bg-zinc-950 text-white border-zinc-950"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              <Hash className="size-3.5" />
              {rulesOpen ? t("captions.hideRules") : t("captions.campaignRules")}
              {hasActiveRules && !rulesOpen && (
                <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
            {/* AI Captions */}
            <button
              type="button"
              onClick={onGenerate}
              className="inline-flex items-center gap-1.5 rounded bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium shadow-sm"
            >
              <Sparkles className="size-3.5" />
              {t("captions.generateAI")}
            </button>
          </div>
        </div>

        {/* Metadata Rules Panel — collapsible */}
        {rulesOpen && (
          <MetadataRulesPanel
            rules={metadataRules}
            onChange={onMetadataRulesChange}
            sampleCaption={sampleCaption}
          />
        )}

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
            <span>{t("captions.sameForAll")}</span>
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
              <p className="text-sm font-medium text-zinc-700">{t("captions.noAccounts")}</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
                {t("captions.noAccountsDesc")}
              </p>
            </div>
          ) : sameForAll ? (
            <div className="overflow-y-auto max-h-[60vh] rounded-lg">
              <AccountPreviewCard
                platform={{ ...platforms[0], charLimit: 2200, borderClass: "border-zinc-300", textClass: "text-zinc-700", name: t("captions.allPlatforms") }}
                value={getCaption(platforms[0].id)}
                onChange={(v) => setCaption(platforms[0].id, v)}
                firstComment={getFirstComment(platforms[0].id)}
                onFirstCommentChange={(v) => setFirstComment(platforms[0].id, v)}
                hasVideo={hasVideo}
                advancedOptions={getAdvancedOptions(platforms[0].id)}
                onAdvancedOptionsChange={(next) => setAdvancedOptions(platforms[0].id, next)}
                mediaKind={mediaKind}
                selectOptions={selectOptions}
              />
            </div>
          ) : platforms.length === 1 ? (
            <div className="overflow-y-auto max-h-[60vh] rounded-lg">
              <AccountPreviewCard
                platform={platforms[0]}
                value={getCaption(platforms[0].id)}
                onChange={(v) => setCaption(platforms[0].id, v)}
                firstComment={getFirstComment(platforms[0].id)}
                onFirstCommentChange={(v) => setFirstComment(platforms[0].id, v)}
                hasVideo={hasVideo}
                community={community}
                onCommunityChange={onCommunityChange}
                quoteTweet={quoteTweet}
                onQuoteTweetChange={onQuoteTweetChange}
                advancedOptions={getAdvancedOptions(platforms[0].id)}
                onAdvancedOptionsChange={(next) => setAdvancedOptions(platforms[0].id, next)}
                mediaKind={mediaKind}
                selectOptions={selectOptions}
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
                  firstComment={getFirstComment(p.id)}
                  onFirstCommentChange={(v) => setFirstComment(p.id, v)}
                  hasVideo={hasVideo}
                  community={community}
                  onCommunityChange={onCommunityChange}
                  quoteTweet={quoteTweet}
                  onQuoteTweetChange={onQuoteTweetChange}
                  advancedOptions={getAdvancedOptions(p.id)}
                  onAdvancedOptionsChange={(next) => setAdvancedOptions(p.id, next)}
                  mediaKind={mediaKind}
                  selectOptions={selectOptions}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tag Users — sticky at bottom of card (shared across platforms) */}
        {showTagUsers ? (
          <div ref={tagUsersRef} className="flex-shrink-0 border-t pt-3">
            <TagUsersInput value={tagUsers} onChange={onTagUsersChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
