// Local + server draft persistence layer.
//
// Primary path: localStorage (one key per workspace) so the Drafts page can
// list them and the Create page can restore them on Continue. NOTE: mediaItems
// are stored as a metadata-only summary; actual files are not persisted
// (no File API in localStorage) — URLs are kept when they are remote (cdnUrl)
// and dropped when they are object URLs from this session.
//
// Secondary path: when authenticated and the server is reachable, drafts are
// mirrored to /api/drafts so they survive across devices. The local copy
// remains the source of truth for snappy UX; the server copy is a sync target.

import type { PlatformId } from "./platforms";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

const DRAFTS_KEY = "postplanify.drafts.v1";

export interface DraftMediaItem {
  kind: "image" | "video";
  cdnUrl?: string;
  remoteUrl?: string;
  // localId lets the editor match an existing mediaItems array (object URL kept in memory)
  // to the persisted record on restore. Not the blob itself.
  localId?: string;
  name?: string;
  mime?: string;
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
  workspaceId?: string;
}

function readAll(): Record<string, DraftRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, DraftRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DraftRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
  } catch {
    // quota exceeded — drop oldest, retry once
    const entries = Object.entries(all).sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    if (entries.length > 1) {
      const { [entries[0][0]]: _drop, ...rest } = all;
      try {
        window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(rest));
      } catch {}
    }
  }
}

async function syncToServer(record: DraftRecord): Promise<void> {
  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    const overrides = getOverrideHeaders();
    Object.entries(overrides).forEach(([k, v]) => headers.set(k, v));
    await fetch("/api/drafts", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({
        id: record.id,
        caption: Object.values(record.captions)[0] ?? "",
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
      }),
    });
  } catch {
    // Best-effort sync; local copy is authoritative for offline UX.
  }
}

export function saveDraft(record: DraftRecord): void {
  const all = readAll();
  all[record.id] = { ...record, updatedAt: Date.now() };
  writeAll(all);
  void syncToServer(all[record.id]);
}

export function loadDraft(id: string): DraftRecord | null {
  const all = readAll();
  return all[id] ?? null;
}

export function listDrafts(): DraftRecord[] {
  const all = readAll();
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteDraft(id: string): void {
  const all = readAll();
  delete all[id];
  writeAll(all);
  if (typeof window !== "undefined") {
    const headers = new Headers();
    const overrides = getOverrideHeaders();
    Object.entries(overrides).forEach(([k, v]) => headers.set(k, v));
    void fetch(`/api/drafts/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
      credentials: "same-origin",
    }).catch(() => undefined);
  }
}

export function newDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}