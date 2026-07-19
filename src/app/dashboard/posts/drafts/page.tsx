"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Trash2,
  Loader2,
  CheckCircle2,
  Info,
  X,
  AlertTriangle,
  Inbox,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  listDrafts,
  deleteDraft,
  type DraftRecord,
} from "@/lib/drafts";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform } from "@/lib/platforms";

type Platform =
  | "instagram"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "twitter"
  | "youtube"
  | "facebook"
  | "tiktok"
  | "linkedin";

interface DraftAccount {
  id: string;
  handle: string;
  platform: Platform;
}

interface Draft {
  id: string;
  mediaType: "image" | "video" | "none";
  mediaColor?: string;
  mediaInitial?: string;
  mediaThumb?: string;
  caption: string;
  accounts: DraftAccount[];
  createdDate: string;
  createdTime: string;
}

function PlatformGlyph({ platform, className }: { platform: Platform; className?: string }) {
  const meta = getPlatform(platform);
  if (!meta) return null;
  return <PlatformAvatar platform={meta} size={16} className={className} />;
}

const PLATFORM_META: Record<Platform, { label: string }> = {
  instagram: { label: "Instagram" },
  pinterest: { label: "Pinterest" },
  threads: { label: "Threads" },
  bluesky: { label: "Bluesky" },
  twitter: { label: "X" },
  youtube: { label: "YouTube" },
  facebook: { label: "Facebook" },
  tiktok: { label: "TikTok" },
  linkedin: { label: "LinkedIn" },
};

const SAMPLE_ACCOUNTS: DraftAccount[] = [
  { id: "1", handle: "nicklorance7", platform: "instagram" },
  { id: "2", handle: "nicklorance7", platform: "pinterest" },
  { id: "3", handle: "nicklorance7", platform: "threads" },
  { id: "4", handle: "nicklorance.bsky.social", platform: "bluesky" },
  { id: "5", handle: "LoranceNic36048", platform: "twitter" },
  { id: "6", handle: "Zakaria 11", platform: "youtube" },
  { id: "7", handle: "nick lorance life", platform: "facebook" },
  { id: "8", handle: "nick_lorance", platform: "tiktok" },
  { id: "9", handle: "Nick Lorance", platform: "linkedin" },
];

const DEMO_DRAFT: Draft = {
  id: "demo-draft",
  mediaType: "image",
  mediaColor: "bg-zinc-900",
  caption:
    "What if your next app started as a simple prompt? The visual says it clearly: describe the app, let AI build it, and ship it the same day. No code, no friction — just the idea becoming real. What would you build first?",
  accounts: SAMPLE_ACCOUNTS,
  createdDate: "Jun 23, 2026",
  createdTime: "16:11",
};

// Derive a display row from a DraftRecord (the persisted shape) so the same
// table renders both real saved drafts and the always-visible demo row.
function recordToRow(r: DraftRecord): Draft {
  const firstMedia = r.mediaItems?.[0];
  const caption = Object.values(r.captions ?? {}).reduce<string>(
    (acc, c) => (c.length > acc.length ? c : acc),
    "",
  ) || r.tagUsers || "";
  const date = new Date(r.updatedAt);
  return {
    id: r.id,
    mediaType: firstMedia?.kind ?? "none",
    mediaColor: firstMedia ? undefined : "bg-zinc-900",
    mediaThumb: firstMedia?.cdnUrl ?? firstMedia?.remoteUrl,
    caption,
    accounts: (r.selected ?? []).map((p, i) => ({
      id: `${r.id}-${p}-${i}`,
      handle: SAMPLE_ACCOUNTS.find((a) => a.platform === p)?.handle ?? p,
      platform: p as Platform,
    })),
    createdDate: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    createdTime: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

interface ApiDraft {
  id: string;
  caption?: string;
  platforms?: Platform[];
  mediaCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

function apiDraftToRow(d: ApiDraft): Draft {
  const date = new Date(d.updatedAt ?? d.createdAt ?? Date.now());
  return {
    id: d.id,
    mediaType: (d.mediaCount ?? 0) > 0 ? "image" : "none",
    mediaColor: (d.mediaCount ?? 0) > 0 ? undefined : "bg-zinc-900",
    caption: d.caption ?? "",
    accounts: (d.platforms ?? []).map((p, i) => ({
      id: `${d.id}-${p}-${i}`,
      handle: SAMPLE_ACCOUNTS.find((a) => a.platform === p)?.handle ?? p,
      platform: p as Platform,
    })),
    createdDate: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    createdTime: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function PlatformBadge({ account }: { account: DraftAccount }) {
  const meta = getPlatform(account.platform);
  if (!meta) return null;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-1 pr-2.5 py-1 text-xs font-medium text-zinc-700"
      title={`${meta.name}: ${account.handle}`}
    >
      <PlatformAvatar platform={meta} size={20} rounded="full" />
      <span className="max-w-[110px] truncate">{account.handle}</span>
    </div>
  );
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

type SortKey = "recent" | "oldest" | "az";

export default function DraftsPage() {
  const t = useTranslations("dashboard");
  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "recent", label: t("posts.drafts.sort_newest") },
    { value: "oldest", label: t("posts.drafts.sort_oldest") },
    { value: "az", label: t("posts.drafts.sort_caption_az") },
  ];
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);

  const router = useRouter();

  // Hydrate from API first, fall back to localStorage. Show the demo row only
  // when no real drafts exist, so the page is never empty on first visit but
  // real saves appear immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/drafts", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { drafts?: ApiDraft[] };
          if (cancelled) return;
          const apiDrafts = (data.drafts ?? []).map(apiDraftToRow);
          if (apiDrafts.length > 0) {
            setDrafts(apiDrafts);
            return;
          }
        }
      } catch {
        // network — fall through to localStorage
      }
      if (cancelled) return;
      const records = listDrafts();
      if (records.length > 0) {
        setDrafts(records.map(recordToRow));
      } else {
        setDrafts([DEMO_DRAFT]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh when the tab regains focus (e.g. user came back from Create page).
  useEffect(() => {
    const handler = async () => {
      try {
        const res = await fetch("/api/drafts", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { drafts?: ApiDraft[] };
          const apiDrafts = (data.drafts ?? []).map(apiDraftToRow);
          if (apiDrafts.length > 0) {
            setDrafts(apiDrafts);
            return;
          }
        }
      } catch {
        // ignore
      }
      const records = listDrafts();
      if (records.length > 0) setDrafts(records.map(recordToRow));
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleContinue = (draft: Draft) => {
    setLoadingId(draft.id);
    if (draft.id === DEMO_DRAFT.id) {
      // The demo row has no persisted record — show a hint instead of navigating.
      showToast("Save a draft first to enable Continue", "info");
      setLoadingId(null);
      return;
    }
    router.push(`/dashboard/posts/create?draft=${encodeURIComponent(draft.id)}`);
  };

  const requestDelete = (draft: Draft) => {
    setConfirmDelete(draft);
  };

  const confirmAndDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    if (id !== DEMO_DRAFT.id) {
      deleteDraft(id);
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("Draft deleted", "success");
    setConfirmDelete(null);
  };

  const filteredDrafts = (() => {
    let list = drafts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.caption.toLowerCase().includes(q) ||
        d.accounts.some((a) =>
          a.handle.toLowerCase().includes(q) ||
          PLATFORM_META[a.platform].label.toLowerCase().includes(q)
        )
      );
    }
    const sorted = [...list];
    if (sort === "az") {
      sorted.sort((a, b) => a.caption.localeCompare(b.caption));
    } else {
      sorted.sort((a, b) => {
        const ad = new Date(`${a.createdDate} ${a.createdTime}`).getTime();
        const bd = new Date(`${b.createdDate} ${b.createdTime}`).getTime();
        return sort === "recent" ? bd - ad : ad - bd;
      });
    }
    return sorted;
  })();

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
      </div>

      {drafts.length === 0 ? (
        <EmptyDrafts />
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
                className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                aria-label={t("posts.drafts.search_placeholder")}
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
              >
                Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                <ChevronDown className={cn("size-3.5 transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen ? (
                <ul
                  role="listbox"
                  className="absolute right-0 mt-1 z-10 w-48 rounded-md border border-zinc-200 bg-white shadow-lg py-1 text-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 hover:bg-zinc-50",
                          sort === opt.value && "bg-zinc-50 font-medium"
                        )}
                        role="option"
                        aria-selected={sort === opt.value}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[900px]">
            <colgroup>
              <col style={{ width: "120px" }} />
              <col style={{ width: "260px" }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  {t("posts.drafts.col_media")}
                </th>
                <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                  {t("posts.drafts.col_caption")}
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  {t("posts.drafts.col_accounts")}
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  {t("posts.drafts.col_created")}
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  {t("posts.drafts.col_actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-500">
                    {t("posts.drafts.no_results", { search })}
                  </td>
                </tr>
              ) : null}
              {filteredDrafts.map((draft) => (
                <tr
                  key={draft.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-6 py-2 align-middle">
                    {draft.mediaThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.mediaThumb}
                        alt=""
                        className="size-20 rounded-md object-cover border border-zinc-200"
                      />
                    ) : (
                      <div
                        className={`size-20 rounded-md ${draft.mediaColor ?? "bg-zinc-900"} flex items-center justify-center text-white text-xs font-medium`}
                      >
                        {draft.mediaInitial ?? ""}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <p className="text-sm text-zinc-700 line-clamp-3 leading-relaxed">
                      {draft.caption}
                    </p>
                  </td>
                  <td className="px-6 py-2 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      {draft.accounts.map((account) => (
                        <PlatformBadge
                          key={account.id}
                          account={account}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-900">
                        {draft.createdDate}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {draft.createdTime}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2 align-middle">
                    <div className="flex flex-col gap-1.5 w-[100px]">
                      <button
                        type="button"
                        onClick={() => handleContinue(draft)}
                        disabled={loadingId === draft.id}
                        className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                      >
                        {loadingId === draft.id ? (
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
                        onClick={() => requestDelete(draft)}
                        disabled={loadingId === draft.id}
                        className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="size-3" />
                        {t("posts.drafts.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setConfirmDelete(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center size-9 rounded-full bg-red-50">
                  <AlertTriangle className="size-4.5 text-red-600" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">{t("posts.drafts.delete_title")}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{t("posts.drafts.delete_subtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-700">
                {t("posts.drafts.delete_body")}
                {confirmDelete.caption ? (
                  <>
                    {" "}
                    <span className="text-zinc-500">
                      “{confirmDelete.caption.slice(0, 60)}{confirmDelete.caption.length > 60 ? "…" : ""}”
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-end gap-2 bg-zinc-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t("posts.drafts.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmAndDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-500 hover:bg-red-600 px-4 h-9 text-sm font-medium text-white"
              >
                <Trash2 className="size-3.5" />
                {t("posts.drafts.delete_draft")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg min-w-[280px]"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="size-4 text-rose-600 shrink-0" />
            )}
            <span className="text-sm text-zinc-900">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyDrafts() {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-20 flex flex-col items-center justify-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Inbox className="size-5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{t("posts.drafts.empty_title")}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {t("posts.drafts.empty_subtitle")}
      </p>
    </div>
  );
}