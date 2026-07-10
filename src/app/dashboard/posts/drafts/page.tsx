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
} from "lucide-react";
import {
  listDrafts,
  deleteDraft,
  type DraftRecord,
} from "@/lib/drafts";

type Platform =
  | "instagram"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "x"
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
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.314-.087-.79-.166-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.593-1.281-.892-2.298-.892H12c-.785 0-1.378.16-1.769.474-.41.33-.65.836-.717 1.503l-2.06-.272c.146-2.302 1.656-3.788 4.362-3.788h.013c3.062 0 4.932 2.02 5.146 5.564.022.302.034.612.034.93 1.63.708 2.778 1.85 3.317 3.314.617 1.685.488 3.834-.764 5.512-1.745 2.337-3.876 3.51-7.114 3.535h-.026" />
        </svg>
      );
    case "bluesky":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.59 3.513 6.182 3.225-3.71.547-7.081 2.118-3.36 7.498 4.166 5.965 5.706-1.275 6.554-4.846.848 3.571 1.927 10.654 6.554 4.846 3.72-5.38.349-6.951-3.36-7.498 2.591.288 5.397-.598 6.182-3.225.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.92a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.33z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
  }
}

const PLATFORM_META: Record<
  Platform,
  { label: string; bg: string; color: string }
> = {
  instagram: { label: "Instagram", bg: "bg-pink-50", color: "text-pink-600" },
  pinterest: { label: "Pinterest", bg: "bg-rose-50", color: "text-rose-600" },
  threads: { label: "Threads", bg: "bg-zinc-100", color: "text-zinc-900" },
  bluesky: { label: "Bluesky", bg: "bg-sky-50", color: "text-sky-500" },
  x: { label: "X", bg: "bg-zinc-900", color: "text-white" },
  youtube: { label: "YouTube", bg: "bg-red-50", color: "text-red-600" },
  facebook: { label: "Facebook", bg: "bg-blue-50", color: "text-blue-600" },
  tiktok: { label: "TikTok", bg: "bg-zinc-900", color: "text-white" },
  linkedin: { label: "LinkedIn", bg: "bg-blue-50", color: "text-blue-700" },
};

const SAMPLE_ACCOUNTS: DraftAccount[] = [
  { id: "1", handle: "nicklorance7", platform: "instagram" },
  { id: "2", handle: "nicklorance7", platform: "pinterest" },
  { id: "3", handle: "nicklorance7", platform: "threads" },
  { id: "4", handle: "nicklorance.bsky.social", platform: "bluesky" },
  { id: "5", handle: "LoranceNic36048", platform: "x" },
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
      handle: SAMPLE_ACCOUNTS.find((a) => a.platform === (p === "twitter" ? "x" : p))?.handle ?? p,
      platform: (p === "twitter" ? "x" : p) as Platform,
    })),
    createdDate: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    createdTime: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function PlatformBadge({ account }: { account: DraftAccount }) {
  const meta = PLATFORM_META[account.platform];
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-1 pr-2.5 py-1 text-xs font-medium text-zinc-700"
      title={`${meta.label}: ${account.handle}`}
    >
      <span
        className={`inline-flex items-center justify-center size-5 rounded-full ${meta.bg}`}
      >
        <PlatformGlyph platform={account.platform} className={`size-3 ${meta.color}`} />
      </span>
      <span className="max-w-[110px] truncate">{account.handle}</span>
    </div>
  );
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Draft | null>(null);

  const router = useRouter();

  // Hydrate from localStorage. Show the demo row only when no real drafts exist,
  // so the page is never empty on first visit but real saves appear immediately.
  useEffect(() => {
    const records = listDrafts();
    if (records.length > 0) {
      setDrafts(records.map(recordToRow));
    } else {
      setDrafts([DEMO_DRAFT]);
    }
  }, []);

  // Refresh when the tab regains focus (e.g. user came back from Create page).
  useEffect(() => {
    const handler = () => {
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

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-[32px]">
            Drafts
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            View and manage all your draft posts. Edit, schedule, or publish them
            when you&apos;re ready.
          </p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <EmptyDrafts />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: "153px" }} />
              <col style={{ width: "245px" }} />
              <col style={{ width: "384px" }} />
              <col style={{ width: "184px" }} />
              <col style={{ width: "184px" }} />
            </colgroup>
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  Media
                </th>
                <th className="text-left px-3 py-2.5 text-sm font-medium text-zinc-500">
                  Caption
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  Accounts
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  Created
                </th>
                <th className="text-left px-6 py-2.5 text-sm font-medium text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
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
                        className="size-24 rounded-md object-cover border border-zinc-200"
                      />
                    ) : (
                      <div
                        className={`size-24 rounded-md ${draft.mediaColor ?? "bg-zinc-900"} flex items-center justify-center text-white text-xs font-medium`}
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
                  <td className="px-6 py-2 align-top">
                    <div className="flex flex-col pt-1">
                      <span className="text-sm text-zinc-900">
                        {draft.createdDate}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {draft.createdTime}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2 align-middle">
                    <div className="flex flex-col gap-2 items-start">
                      <button
                        type="button"
                        onClick={() => handleContinue(draft)}
                        disabled={loadingId === draft.id}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white text-sm font-medium whitespace-nowrap transition-colors"
                      >
                        {loadingId === draft.id ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="size-3.5" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(draft)}
                        disabled={loadingId === draft.id}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium whitespace-nowrap transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <h2 className="text-base font-semibold text-zinc-900">Delete draft?</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">This cannot be undone.</p>
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
                Are you sure you want to delete this draft?
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
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-500 hover:bg-red-600 px-4 h-9 text-sm font-medium text-white"
              >
                <Trash2 className="size-3.5" />
                Delete draft
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
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-20 flex flex-col items-center justify-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Inbox className="size-5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">No drafts yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Start creating a post and save it as a draft to see it here.
      </p>
    </div>
  );
}