// Local + server draft persistence layer.
//
// Primary path: localStorage (one key per user UID) so the Drafts page can
// list them and the Create page can restore them on Continue. NOTE: mediaItems
// are stored as a metadata-only summary; actual files are not persisted
// (no File API in localStorage) — URLs are kept when they are remote (cdnUrl)
// and dropped when they are object URLs from this session.
//
// Secondary path: when authenticated and the server is reachable, drafts are
// mirrored to /api/drafts so they survive across devices. The local copy
// remains the source of truth for snappy UX; the server copy is a sync target.

import type { PlatformId } from "./platforms";
import { getPlatform } from "./platforms";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

const DRAFTS_KEY_PREFIX = "postplanify.drafts.v1";

/** Build a per-user storage key so multiple users on the same device don't
 *  share drafts. Falls back to a shared key when no UID is provided (e.g.
 *  during SSR or before Firebase resolves). */
function storageKey(uid?: string | null): string {
  if (uid && uid.length > 0) return `${DRAFTS_KEY_PREFIX}.${uid}`;
  return `${DRAFTS_KEY_PREFIX}.anon`;
}

export interface DraftMediaItem {
  kind: "image" | "video";
  cdnUrl?: string;
  remoteUrl?: string;
  // localId lets the editor match an existing mediaItems array (object URL kept in memory)
  // to the persisted record on restore. Not the blob itself.
  localId?: string;
  name?: string;
  mime?: string;
  durationSec?: number;
  metadataLoaded?: boolean;
  metadataError?: string;
}

export interface DraftRecord {
  id: string;
  createdAt: number; // unix ms
  updatedAt: number; // unix ms
  captions: Record<string, string>;
  sameForAll: boolean;
  community: string;
  quoteTweet: string;
  tagUsers: string;
  selected: PlatformId[];
  collaborators: string[];
  mediaItems: DraftMediaItem[];
  activeMedia: number;
  customCoverUrl: string | null;
  frameCoverUrl: string | null;
  firstComment?: string;
  /** Per-platform first comments (preferred over the flat `firstComment`). */
  firstComments?: Record<string, string>;
  /** Per-platform alt text keyed by mediaItem id. */
  altTexts?: Record<string, string>;
  /** Composer mode + mode-specific state, restored as-is. */
  composerMode?: "standard" | "carousel" | "trial_reel" | "document";
  carouselItems?: Array<{ cdnUrl: string; name: string; kind: "image" | "video"; mimeType?: string; durationSec?: number; metadataLoaded?: boolean; metadataError?: string }>;
  trialReelFile?: { cdnUrl: string; name: string; mimeType?: string; durationSec?: number; metadataLoaded?: boolean; metadataError?: string };
  trialMode?: string;
  documentFile?: { cdnUrl: string; name: string; mimeType: string };
  documentTitle?: string;
  /** Per-platform advanced options snapshot. */
  advancedByPlatform?: Record<string, Record<string, string | number | boolean | string[] | undefined>>;
  metadataRules?: {
    enabled: boolean;
    hashtags: string[];
    ctaLine: string;
    mode: string;
    startDate: string;
    endDate: string;
  };
  workspaceId?: string;
}

function readAll(uid?: string | null): Record<string, DraftRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, DraftRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DraftRecord>, uid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(all));
  } catch {
    // quota exceeded — drop oldest, retry once
    const entries = Object.entries(all).sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    if (entries.length > 1) {
      const { [entries[0][0]]: _drop, ...rest } = all;
      try {
        window.localStorage.setItem(storageKey(uid), JSON.stringify(rest));
      } catch {}
    }
  }
}

/** Build auth-aware headers for /api/drafts. The bearer idToken is mandatory
 *  for the server-side `requireSession()` guard; override headers let local
 *  dev injected keys (upload-post, n8n, bunny) flow through. */
function buildHeaders(idToken: string | null, extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra, ...getOverrideHeaders() };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  return headers;
}

/** Primary caption for the draft — the longest per-platform caption, or the
 *  flat fallback. Empty string when nothing was typed; tagUsers is *not* a
 *  caption and must not leak into the row preview. */
function primaryCaption(record: DraftRecord): string {
  let best = "";
  for (const v of Object.values(record.captions ?? {})) {
    if (typeof v === "string" && v.length > best.length) best = v;
  }
  return best || record.firstComment || "";
}

async function syncToServer(record: DraftRecord, idToken: string | null): Promise<void> {
  try {
    // The `selected` field on the server schema is a Record (per-platform
    // caption map), but the legacy client code was sending `record.captions`
    // under that key — which made the next GET render the wrong platforms.
    // The platforms list belongs on the top-level `platforms` field, and the
    // per-platform captions map belongs on `selected`. Send both correctly.
    const caption = primaryCaption(record);
    const payload = {
      id: record.id,
      caption,
      platforms: record.selected,
      mediaItems: record.mediaItems
        .filter((m) => m.cdnUrl || m.remoteUrl)
        .map((m) => ({
          id: m.localId ?? m.cdnUrl ?? m.remoteUrl ?? "media",
          url: m.cdnUrl ?? m.remoteUrl ?? "",
          type: m.kind,
          name: m.name,
        })),
      sameForAll: record.sameForAll,
      selected: record.captions,
      collaborators: record.collaborators.map((c) => ({ uid: c, handle: c, status: "invited" })),
      customCoverUrl: record.customCoverUrl ?? undefined,
      frameCoverUrl: record.frameCoverUrl ?? undefined,
      tagUsers: record.tagUsers ? record.tagUsers.split(/[\s,]+/).filter(Boolean) : [],
      community: record.community || undefined,
      quoteTweetUrl: record.quoteTweet || undefined,
      firstComment: record.firstComment || undefined,
    };
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: buildHeaders(idToken, { "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Surface a soft warning so the UI can show a toast — local copy is
      // still authoritative for offline UX, but the user should know the
      // server mirror diverged.
      if (typeof window !== "undefined") {
        const w = window as unknown as { __postplanifyDraftSyncError?: (id: string) => void };
        if (typeof w.__postplanifyDraftSyncError === "function") {
          w.__postplanifyDraftSyncError(record.id);
        }
      }
    }
  } catch {
    // Network failure — best-effort sync, same as before; local copy wins.
  }
}

export function saveDraft(record: DraftRecord, opts: { uid?: string | null; idToken?: string | null } = {}): void {
  const uid = opts.uid ?? null;
  const all = readAll(uid);
  all[record.id] = { ...record, updatedAt: Date.now() };
  writeAll(all, uid);
  void syncToServer(all[record.id], opts.idToken ?? null);
}

export function loadDraft(id: string, uid?: string | null): DraftRecord | null {
  return readAll(uid)[id] ?? null;
}

export function listDrafts(uid?: string | null): DraftRecord[] {
  return Object.values(readAll(uid)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDraft(
  id: string,
  opts: { uid?: string | null; idToken?: string | null } = {},
): Promise<{ ok: boolean }> {
  const uid = opts.uid ?? null;
  const all = readAll(uid);
  delete all[id];
  writeAll(all, uid);
  if (typeof window === "undefined") return { ok: true };
  try {
    const res = await fetch(`/api/drafts/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: buildHeaders(opts.idToken ?? null),
      credentials: "include",
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export function newDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Resolve a display handle for one of the seed platforms in
 *  `src/lib/platforms.ts`. Used to populate the legacy `handle` field on
 *  accounts in the drafts table when the workspace doesn't have a connected
 *  account yet. */
export function defaultHandleFor(platformId: string): string {
  return getPlatform(platformId)?.handle ?? "";
}
