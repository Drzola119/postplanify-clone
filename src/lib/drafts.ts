// Local draft persistence layer.
// Drafts are kept in localStorage (one key per workspace) so the Drafts page
// can list them and the Create page can restore them on Continue.
// NOTE: mediaItems are stored as a metadata-only summary; actual files are
// not persisted (no File API in localStorage) — URLs are kept when they are
// remote (cdnUrl) and dropped when they are object URLs from this session.

import type { PlatformId } from "./platforms";

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

export function saveDraft(record: DraftRecord): void {
  const all = readAll();
  all[record.id] = { ...record, updatedAt: Date.now() };
  writeAll(all);
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
}

export function newDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}