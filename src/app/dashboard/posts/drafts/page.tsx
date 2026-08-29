"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Trash2,
  Loader2,
  Inbox,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  Check,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform, type PlatformId } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { listDrafts as listLocalDrafts, deleteDraft as deleteLocalDraft } from "@/lib/drafts";
import {
  draftToRow,
  matchesSearch,
  sortDrafts,
  formatRowDateTime,
  type DraftRow,
  type DraftSortKey,
  type DraftRecordLike,
} from "@/lib/drafts/row";

interface ApiDraftListItem {
  id: string;
  caption?: string;
  platforms?: PlatformId[];
  mediaItems?: Array<{ id?: string; url?: string; type?: "image" | "video" }>;
  mediaCount?: number;
  firstMediaUrl?: string;
  firstMediaType?: "image" | "video";
  updatedAt?: string;
  createdAt?: string;
}

const PAGE_SIZE = 25;
const DELETE_CONCURRENCY = 3;

export default function DraftsPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { getIdToken, user } = useAuth();
  const { toast } = useToast();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmSingle, setConfirmSingle] = useState<DraftRow | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DraftSortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [continuingId, setContinuingId] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement | null>(null);
  const requestSeq = useRef(0);

  const SORT_OPTIONS: { value: DraftSortKey; label: string }[] = useMemo(() => [
    { value: "recent", label: t("posts.drafts.sort_newest") },
    { value: "oldest", label: t("posts.drafts.sort_oldest") },
    { value: "az", label: t("posts.drafts.sort_caption_az") },
  ], [t]);

  // Close the sort menu on outside click and Escape.
  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen]);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const idToken = await getIdToken();
      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
        ...getOverrideHeaders(),
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      };
      return fetch(input, { ...init, credentials: "include", headers });
    },
    [getIdToken],
  );

  const loadDrafts = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await authedFetch("/api/drafts");
      if (seq !== requestSeq.current) return;
      let serverRows: DraftRow[] = [];
      if (res.ok) {
        const data = (await res.json()) as { drafts?: ApiDraftListItem[] };
        const list = data.drafts ?? [];
        serverRows = list.map((d) => draftToRow({
          id: d.id,
          updatedAt: d.updatedAt ?? d.createdAt ?? Date.now(),
          createdAt: d.createdAt ?? d.updatedAt,
          caption: d.caption,
          platforms: d.platforms,
          mediaItems: (d.mediaItems ?? []).map((m) => ({
            kind: m.type ?? "image",
            cdnUrl: m.url,
          })),
        }));
      }
      // Always merge local drafts (per-UID + anon fallback migration) so
      // drafts saved before login or while offline still appear. Server rows
      // take precedence for the same id.
      const localUuidRows: DraftRow[] = (() => {
        const uid = user?.uid ?? null;
        const byId = new Map<string, DraftRow>();
        // Primary key: per-UID
        for (const r of listLocalDrafts(uid)) {
          byId.set(r.id, draftToRow(r as DraftRecordLike));
        }
        // Fallback: anon key (migrate drafts saved before auth resolved)
        if (uid) {
          for (const r of listLocalDrafts(null)) {
            if (!byId.has(r.id)) byId.set(r.id, draftToRow(r as DraftRecordLike));
          }
          // Also check explicit anon if different from null behavior
          try {
            const anonRaw = typeof window !== "undefined" ? window.localStorage.getItem("postplanify.drafts.v1.anon") : null;
            if (anonRaw) {
              const anonParsed = JSON.parse(anonRaw) as Record<string, DraftRecordLike>;
              for (const id of Object.keys(anonParsed)) {
                if (!byId.has(id)) byId.set(id, draftToRow(anonParsed[id]));
              }
            }
          } catch {}
        }
        return Array.from(byId.values());
      })();

      const merged = new Map<string, DraftRow>();
      for (const r of localUuidRows) merged.set(r.id, r);
      for (const r of serverRows) merged.set(r.id, r);
      const all = Array.from(merged.values());
      if (seq !== requestSeq.current) return;
      setDrafts(all);
      if (all.length === 0 && !res.ok) {
        setLoadError(t("posts.drafts.error_load"));
      }
    } catch {
      if (seq !== requestSeq.current) return;
      // On network failure, show whatever is in local storage
      const records = listLocalDrafts(user?.uid ?? null);
      const anonFallback = (() => {
        if (!user?.uid) return [];
        try {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem("postplanify.drafts.v1.anon") : null;
          if (!raw) return [];
          const parsed = JSON.parse(raw) as Record<string, DraftRecordLike>;
          return Object.values(parsed);
        } catch { return []; }
      })();
      const mergedMap = new Map<string, DraftRecordLike>();
      for (const r of anonFallback) if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
      for (const r of records) mergedMap.set(r.id, r as DraftRecordLike);
      const rows = Array.from(mergedMap.values()).map((r) => draftToRow(r));
      setDrafts(rows);
      if (rows.length === 0) setLoadError(t("posts.drafts.error_load"));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [authedFetch, t, user?.uid]);

  // Initial load.
  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  // Refresh when the tab regains focus (debounced so rapid focus changes
  // don't fire one fetch per event).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") void loadDrafts();
      }, 250);
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", handler);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("focus", handler);
    };
  }, [loadDrafts]);

  // Surfacing from the data-layer's best-effort sync when a server POST fails.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __postplanifyDraftSyncError?: (id: string) => void };
    w.__postplanifyDraftSyncError = () => {
      toast({
        title: t("posts.drafts.sync_failed"),
        tone: "warning",
      });
    };
    return () => {
      if (w.__postplanifyDraftSyncError) w.__postplanifyDraftSyncError = undefined;
    };
  }, [toast, t]);

  // Filter + sort memoized so the table doesn't re-walk on every render.
  const visible = useMemo(() => {
    const filtered = search.trim()
      ? drafts.filter((d) => matchesSearch(d, search))
      : drafts;
    return sortDrafts(filtered, sort);
  }, [drafts, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [visible, page],
  );

  // Reset to first page when filter / sort changes shrink the list below the current page.
  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  // Drop selection IDs that no longer exist (batch delete removed local rows).
  useEffect(() => {
    if (selected.size === 0) return;
    const live = new Set(drafts.map((d) => d.id));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (live.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [drafts, selected.size]);

  const handleContinue = useCallback(async (draft: DraftRow) => {
    setContinuingId(draft.id);
    try {
      router.push(`/dashboard/posts/create?draft=${encodeURIComponent(draft.id)}`);
    } finally {
      // Reset on next tick so the spinner survives the route transition.
      setTimeout(() => setContinuingId(null), 500);
    }
  }, [router]);

  const handleDelete = useCallback(async (draft: DraftRow) => {
    setConfirmSingle(draft);
  }, []);

  const confirmSingleDelete = useCallback(async () => {
    const target = confirmSingle;
    if (!target) return;
    setConfirmSingle(null);
    setBusyIds((prev) => new Set(prev).add(target.id));
    // Remove from local state first so the row disappears immediately even
    // if the network is slow; restore on failure.
    const rollback = target;
    setDrafts((prev) => prev.filter((d) => d.id !== target.id));
    const result = await deleteLocalDraft(target.id, { uid: user?.uid ?? null, idToken: await getIdToken() });
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(target.id);
      return next;
    });
    if (result.ok) {
      toast({ title: t("posts.drafts.saved"), tone: "success" });
    } else {
      setDrafts((prev) => (prev.some((d) => d.id === rollback.id) ? prev : [rollback, ...prev]));
      toast({ title: t("posts.drafts.delete_failed"), tone: "error" });
    }
  }, [confirmSingle, getIdToken, t, toast, user?.uid]);

  const runBulkDelete = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return { ok: 0, failed: 0 };
    setBulkDeleting(true);
    const idToken = await getIdToken();
    let ok = 0;
    const failed: string[] = [];
    const queue = ids.slice();
    const workers = Array.from(
      { length: Math.min(DELETE_CONCURRENCY, queue.length) },
      async () => {
        while (queue.length > 0) {
          const id = queue.shift();
          if (!id) break;
          try {
            const local = await deleteLocalDraft(id, { uid: user?.uid ?? null, idToken });
            if (local.ok) ok += 1;
            else failed.push(id);
          } catch {
            failed.push(id);
          }
        }
      },
    );
    await Promise.all(workers);
    return { ok, failed: failed.length };
  }, [getIdToken, user?.uid]);

  const confirmBulkDelete = useCallback(async () => {
    setConfirmBulk(false);
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const snapshot = drafts;
    setDrafts((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
    const result = await runBulkDelete(ids);
    if (result.failed === 0) {
      toast({
        title: t("posts.drafts.bulk_delete_success", { count: result.ok }),
        tone: "success",
      });
    } else if (result.ok > 0) {
      // Partial: we don't know exactly which failed, so resync from the server.
      setDrafts(snapshot);
      void loadDrafts();
      toast({
        title: t("posts.drafts.bulk_delete_partial", { ok: result.ok, failed: result.failed }),
        tone: "warning",
      });
    } else {
      setDrafts(snapshot);
      toast({
        title: t("posts.drafts.bulk_delete_error"),
        tone: "error",
      });
    }
    setBulkDeleting(false);
  }, [loadDrafts, drafts, runBulkDelete, selected, t, toast]);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((d) => selected.has(d.id));
  const toggleAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const d of pageRows) next.delete(d.id);
      } else {
        for (const d of pageRows) next.add(d.id);
      }
      return next;
    });
  }, [allOnPageSelected, pageRows]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-[32px]">
            {t("posts.drafts.page_title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("posts.drafts.page_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/posts/create")}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
        >
          <Plus className="size-3.5" />
          {t("posts.drafts.create_new")}
        </button>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : loadError ? (
        <ErrorPanel message={loadError} onRetry={() => void loadDrafts()} />
      ) : drafts.length === 0 ? (
        <EmptyDrafts onCreate={() => router.push("/dashboard/posts/create")} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("posts.drafts.search_placeholder")}
                aria-label={t("posts.drafts.search_placeholder")}
                className="w-full h-9 pl-9 pr-8 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("posts.drafts.clear_search")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-5 inline-flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 ? (
                <>
                  <span className="text-xs text-zinc-500 hidden sm:inline">
                    {t("posts.drafts.selected_count", { count: selected.size })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmBulk(true)}
                    disabled={bulkDeleting}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium"
                  >
                    {bulkDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    {t("posts.drafts.bulk_delete")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="text-xs text-zinc-500 hover:text-zinc-900 h-9 px-2"
                  >
                    {t("posts.drafts.cancel")}
                  </button>
                </>
              ) : null}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
                >
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown className={cn("size-3.5 transition-transform", sortOpen && "rotate-180")} />
                </button>
                {sortOpen ? (
                  <ul
                    role="listbox"
                    aria-label={t("posts.drafts.sort_aria")}
                    className="absolute right-0 mt-1 z-10 w-48 rounded-md border border-zinc-200 bg-white shadow-lg py-1 text-sm"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <li key={opt.value} role="option" aria-selected={sort === opt.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setSort(opt.value);
                            setSortOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 hover:bg-zinc-50 inline-flex items-center gap-2",
                            sort === opt.value && "bg-zinc-50 font-medium",
                          )}
                        >
                          <span className="size-3 inline-flex items-center justify-center">
                            {sort === opt.value ? <Check className="size-3" /> : null}
                          </span>
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[900px]">
              <colgroup>
                <col style={{ width: "44px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "130px" }} />
              </colgroup>
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      aria-label={t("posts.drafts.select_all")}
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20"
                    />
                  </th>
                  <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                    {t("posts.drafts.col_media")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                    {t("posts.drafts.col_caption")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                    {t("posts.drafts.col_accounts")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                    {t("posts.drafts.col_created")}
                  </th>
                  <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                    {t("posts.drafts.col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-500">
                      {search ? t("posts.drafts.no_results", { search }) : t("posts.drafts.empty_title")}
                    </td>
                  </tr>
                ) : null}
                {pageRows.map((draft) => {
                  const dt = formatRowDateTime(draft.updatedAt);
                  const isBusy = busyIds.has(draft.id) || continuingId === draft.id;
                  const isSelected = selected.has(draft.id);
                  return (
                    <tr
                      key={draft.id}
                      className={cn(
                        "border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50",
                        isSelected && "bg-zinc-50",
                      )}
                    >
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="checkbox"
                          aria-label={t("posts.drafts.select_row", { id: draft.id })}
                          checked={isSelected}
                          onChange={() => toggleOne(draft.id)}
                          className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {draft.mediaUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={draft.mediaUrl}
                            alt=""
                            className="size-20 rounded-md object-cover border border-zinc-200"
                          />
                        ) : (
                          <div
                            className="size-20 rounded-md bg-zinc-900 flex items-center justify-center text-white text-xs font-medium"
                            aria-label={t("posts.drafts.media_none")}
                          >
                            {draft.mediaType === "video" ? "▶" : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <p className="text-sm text-zinc-700 line-clamp-3 leading-relaxed">
                          {draft.caption || <span className="text-zinc-400 italic">{t("posts.drafts.no_caption")}</span>}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          {draft.accounts.length === 0 ? (
                            <span className="text-xs text-zinc-400">{t("posts.drafts.no_accounts")}</span>
                          ) : (
                            draft.accounts.map((account) => (
                              <PlatformBadge key={account.id} account={account} />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm text-zinc-900">{dt.date}</span>
                          <span className="text-xs text-zinc-500">{dt.time}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-col gap-1.5 w-[100px]">
                          <button
                            type="button"
                            onClick={() => void handleContinue(draft)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                          >
                            {continuingId === draft.id ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                {t("posts.drafts.loading")}
                              </>
                            ) : (
                              <>
                                {t("posts.drafts.continue")}
                                <ArrowRight className="size-3" />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(draft)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                          >
                            <Trash2 className="size-3" />
                            {t("posts.drafts.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 bg-zinc-50 text-sm">
              <span className="text-xs text-zinc-500">
                {t("posts.drafts.pagination_page", { page: page + 1, total: totalPages })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label={t("posts.drafts.pagination_prev")}
                  className="size-8 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label={t("posts.drafts.pagination_next")}
                  className="size-8 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={confirmSingle !== null}
        onClose={() => setConfirmSingle(null)}
        onConfirm={() => void confirmSingleDelete()}
        title={t("posts.drafts.delete_title")}
        description={
          confirmSingle?.caption
            ? `${t("posts.drafts.delete_body")} “${confirmSingle.caption.slice(0, 60)}${confirmSingle.caption.length > 60 ? "…" : ""}”`
            : t("posts.drafts.delete_body")
        }
        confirmLabel={t("posts.drafts.delete_draft")}
        cancelLabel={t("posts.drafts.cancel")}
        tone="destructive"
      />

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => void confirmBulkDelete()}
        title={t("posts.drafts.bulk_delete_title", { count: selected.size })}
        description={t("posts.drafts.bulk_delete_body", { count: selected.size })}
        confirmLabel={t("posts.drafts.delete_draft")}
        cancelLabel={t("posts.drafts.cancel")}
        tone="destructive"
      />
    </div>
  );
}

function PlatformBadge({ account }: { account: { id: string; handle: string; platform: PlatformId } }) {
  const meta = getPlatform(account.platform);
  if (!meta) return null;
  const title = account.handle
    ? `${meta.name}: ${account.handle}`
    : `${meta.name}`;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-1 pr-2.5 py-1 text-xs font-medium text-zinc-700"
      title={title}
    >
      <PlatformAvatar platform={meta} size={20} rounded="full" />
      <span className="max-w-[110px] truncate">
        {account.handle || meta.name}
      </span>
    </div>
  );
}

function EmptyDrafts({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-20 flex flex-col items-center justify-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Inbox className="size-5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{t("posts.drafts.empty_title")}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm text-center">
        {t("posts.drafts.empty_subtitle")}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
      >
        <Plus className="size-3.5" />
        {t("posts.drafts.create_new")}
      </button>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden" aria-busy="true">
      <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 h-14" />
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="size-20 rounded-md bg-zinc-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-zinc-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-zinc-100 animate-pulse" />
            </div>
            <div className="size-3.5 text-zinc-400">
              <Loader2 className="size-3.5 animate-spin" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
      <AlertCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900">{t("posts.drafts.error_load")}</p>
        <p className="text-xs text-red-700 mt-1">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100 text-sm font-medium"
        >
          <RefreshCw className="size-3.5" />
          {t("posts.drafts.retry")}
        </button>
      </div>
    </div>
  );
}
