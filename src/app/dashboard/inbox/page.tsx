"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";
import {
  Search,
  Reply,
  Download,
  RefreshCw,
  Check,
  CheckCheck,
  Copy,
  MessageSquare,
  Mail,
  Sparkles,
  AlertTriangle,
  CloudOff,
  Lock,
  Ban,
  Clock,
  ExternalLink,
  Trash2,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";

type Tab = "comments" | "messages";
type StatusFilter = "all" | "unread" | "unresolved";
type SentimentFilter = "all" | "positive" | "neutral" | "negative";
type ReplyKind = "public-reply" | "private-reply";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string }
  | { kind: "quota"; message: string }
  | { kind: "rate-limited"; message: string };

interface Comment {
  id: string;
  platform: string;
  accountKey?: string;
  externalId?: string;
  externalPostId?: string;
  postPermalink?: string;
  authorHandle: string;
  authorExternalId?: string;
  body: string;
  sentAt: string;
  sentiment?: "positive" | "neutral" | "negative";
  labels?: string[];
  read?: boolean;
  resolved?: boolean;
  replied?: boolean;
}

interface Conversation {
  id: string;
  platform: string;
  accountKey?: string;
  participants: string[];
  participantExternalIds?: string[];
  lastMessageAt: string;
  lastInboundAt?: string;
  unreadCount: number;
  read?: boolean;
  resolved?: boolean;
}

interface ThreadMessage {
  id: string;
  fromHandle?: string;
  body?: string;
  sentAt?: unknown;
  direction?: "in" | "out";
  deliveryStatus?: "pending" | "processing" | "sent" | "failed" | "delivery-unknown";
  externalId?: string;
}

interface CapabilityOp {
  operation: string;
  status: string;
  reason: string;
}

interface CapabilityPlatform {
  platform: string;
  connected: boolean;
  operations: CapabilityOp[];
}

const BROWSER_REFRESH_MS = 60_000;

function platformName(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}

function toDateStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object") {
    const r = v as Record<string, unknown>;
    const seconds = r.seconds ?? r._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000).toISOString();
    if (typeof r.toDate === "function") {
      try {
        return ((r.toDate as () => Date)()).toISOString();
      } catch {
        return "";
      }
    }
  }
  return "";
}

function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isPrivateReplyEligible(sentAt: string): boolean {
  const t = new Date(sentAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= 7 * 24 * 60 * 60 * 1000;
}

export default function InboxPage() {
  const t = useTranslations("dashboard");
  const [tab, setTab] = useState<Tab>("comments");
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [stale, setStale] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [conversationsCursor, setConversationsCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityPlatform[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyKind, setReplyKind] = useState<ReplyKind>("public-reply");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [aiDrafting, setAiDrafting] = useState(false);

  const [dmSending, setDmSending] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);

  const [autodm, setAutodm] = useState<{ enabled: boolean; count: number } | null>(null);

  const canWrite = role === "owner" || role === "admin" || role === "editor";
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const opStatus = useCallback(
    (platform: string, operation: string): string => {
      const p = capabilities.find((c) => c.platform === platform);
      return p?.operations.find((o) => o.operation === operation)?.status ?? "not-yet-verified";
    },
    [capabilities]
  );

  const connectedAccounts = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of comments) if (c.accountKey) set.set(c.accountKey, c.platform);
    for (const c of conversations) if (c.accountKey) set.set(c.accountKey, c.platform);
    for (const c of capabilities) if (c.connected) set.set(c.platform, c.platform);
    return [...set.entries()];
  }, [comments, conversations, capabilities]);

  const load = useCallback(
    async (silent = false, append = false) => {
      if (!silent) setState({ kind: "loading" });
      try {
        // Bounded snapshot (single orderBy query — no composite indexes needed).
        // All filters below apply client-side over these loaded results and
        // the UI labels the search scope honestly (spec §10).
        const commentUrl = append && commentsCursor ? `/api/inbox/comments?pageSize=50&cursor=${encodeURIComponent(commentsCursor)}` : "/api/inbox/comments?pageSize=50";
        const messageUrl = append && conversationsCursor ? `/api/inbox/messages?pageSize=50&cursor=${encodeURIComponent(conversationsCursor)}` : "/api/inbox/messages?pageSize=50";
        const [cRes, mRes, capRes, syncRes] = await Promise.all([
          fetch(commentUrl, { credentials: "include" }),
          fetch(messageUrl, { credentials: "include" }),
          fetch("/api/inbox/capabilities", { credentials: "include" }),
          fetch("/api/inbox/sync", { credentials: "include" }),
        ]);
        if (!mounted.current) return;
        // Quota / rate-limit are first-class states — never an empty inbox.
        const quotaHit = [cRes, mRes].find((r) => r.status === 503);
        if (quotaHit) {
          const data = (await quotaHit.json().catch(() => ({}))) as { error?: { message?: string } };
          setStale(true);
          setState({ kind: "quota", message: data.error?.message ?? t("inbox.quota_exhausted") });
          return;
        }
        const rateHit = [cRes, mRes].find((r) => r.status === 429);
        if (rateHit) {
          setStale(true);
          setState({ kind: "rate-limited", message: t("inbox.rate_limited") });
          return;
        }
        if (!cRes.ok || !mRes.ok) throw new Error("load failed");
        const cData = (await cRes.json()) as { comments?: Comment[] };
        const mData = (await mRes.json()) as { conversations?: Conversation[] };
        setComments((prev) => append ? [...prev, ...(Array.isArray(cData.comments) ? cData.comments : [])] : (Array.isArray(cData.comments) ? cData.comments : []));
        setConversations((prev) => append ? [...prev, ...(Array.isArray(mData.conversations) ? mData.conversations : [])] : (Array.isArray(mData.conversations) ? mData.conversations : []));
        setCommentsCursor(typeof (cData as { nextCursor?: unknown }).nextCursor === "string" ? (cData as { nextCursor: string }).nextCursor : null);
        setConversationsCursor(typeof (mData as { nextCursor?: unknown }).nextCursor === "string" ? (mData as { nextCursor: string }).nextCursor : null);
        if (capRes.ok) {
          const cap = (await capRes.json()) as { role?: string; platforms?: CapabilityPlatform[] };
          setRole(cap.role ?? null);
          setCapabilities(Array.isArray(cap.platforms) ? cap.platforms : []);
        }
        if (syncRes.ok) {
          const sync = (await syncRes.json()) as { lastSyncAt?: string | null };
          if (typeof sync.lastSyncAt === "string") setLastSync(sync.lastSyncAt);
        }
        setStale(false);
        setState({ kind: "ready" });
      } catch {
        if (!mounted.current) return;
        // Keep cached content with a stale indicator instead of wiping the inbox.
        if (comments.length > 0 || conversations.length > 0) {
          setStale(true);
          setState({ kind: "ready" });
        } else {
          setState({ kind: "error", message: t("inbox.load_failed") });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, commentsCursor, conversationsCursor]
  );

  const loadMore = async (target: "comments" | "messages") => {
    const cursor = target === "comments" ? commentsCursor : conversationsCursor;
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const endpoint = target === "comments" ? "/api/inbox/comments" : "/api/inbox/messages";
      const res = await fetch(`${endpoint}?pageSize=50&cursor=${encodeURIComponent(cursor)}`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { comments?: Comment[]; conversations?: Conversation[]; nextCursor?: string | null };
      if (target === "comments") {
        setComments((prev) => [...prev, ...(data.comments ?? [])]);
        setCommentsCursor(data.nextCursor ?? null);
      } else {
        setConversations((prev) => [...prev, ...(data.conversations ?? [])]);
        setConversationsCursor(data.nextCursor ?? null);
      }
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  };

  // Initial load.
  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 60s visible-tab browser refresh (reads Firestore only — zero provider cost
  // per viewer). Paused when hidden or offline.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      if (!window.navigator.onLine) return;
      void load(true);
    }, BROWSER_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // AutoDM status (optional panel — never blocks the core inbox).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inbox/autodm", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { enabled?: boolean; monitors?: unknown[] };
        if (mounted.current) setAutodm({ enabled: data.enabled === true, count: Array.isArray(data.monitors) ? data.monitors.length : 0 });
      } catch {
        /* optional */
      }
    })();
  }, []);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncNote(null);
    try {
      const res = await fetch("/api/inbox/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { lastSyncAt?: string; throttled?: boolean; error?: { message?: string } };
      if (res.ok) {
        if (typeof data.lastSyncAt === "string") setLastSync(data.lastSyncAt);
        if (data.throttled) setSyncNote(t("inbox.sync_throttled"));
        await load(true);
      } else {
        setSyncNote(data.error?.message ?? t("inbox.load_failed"));
      }
    } catch {
      setSyncNote(t("inbox.load_failed"));
    } finally {
      if (mounted.current) setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    let list = comments;
    if (statusFilter === "unread") list = list.filter((c) => !c.read && !c.replied);
    if (statusFilter === "unresolved") list = list.filter((c) => !c.resolved);
    if (sentimentFilter !== "all") list = list.filter((c) => (c.sentiment ?? "neutral") === sentimentFilter);
    if (accountFilter !== "all") list = list.filter((c) => c.accountKey === accountFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.body.toLowerCase().includes(q) || c.authorHandle.toLowerCase().includes(q));
    }
    return list;
  }, [comments, statusFilter, sentimentFilter, accountFilter, search]);

  const loadThread = async (conversationId: string) => {
    setActiveConvo(conversationId);
    setThreadLoading(true);
    setDmError(null);
    try {
      const res = await fetch(`/api/inbox/messages?conversationId=${encodeURIComponent(conversationId)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { messages?: ThreadMessage[] };
        if (mounted.current) setThread(Array.isArray(data.messages) ? data.messages : []);
      }
      // Mark read (shared read state).
      await fetch(`/api/inbox/messages?conversationId=${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        credentials: "include",
      }).catch(() => undefined);
      if (mounted.current) {
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0, read: true } : c)));
      }
    } finally {
      if (mounted.current) setThreadLoading(false);
    }
  };

  const openReply = (comment: Comment, kind: ReplyKind) => {
    setReplyTarget(comment);
    setReplyKind(kind);
    setReplyBody("");
    setReplyError(null);
  };

  const handleAiDraft = async () => {
    if (!replyTarget || aiDrafting) return;
    setAiDrafting(true);
    try {
      const res = await fetch("/api/inbox/draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: replyTarget.platform,
          kind: replyKind === "private-reply" ? "dm" : "reply",
          authorHandle: replyTarget.authorHandle,
          body: replyTarget.body,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { draft?: string };
      if (res.ok && data.draft && mounted.current) setReplyBody(data.draft);
      else if (mounted.current) setReplyError(t("inbox.ai_unavailable"));
    } catch {
      if (mounted.current) setReplyError(t("inbox.ai_unavailable"));
    } finally {
      if (mounted.current) setAiDrafting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyTarget || replySending || !replyBody.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: replyTarget.id,
          platform: replyTarget.platform,
          body: replyBody.trim(),
          kind: replyKind,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; status?: string };
      if (res.ok || res.status === 201) {
        if (mounted.current) {
          setComments((prev) => prev.map((c) => (c.id === replyTarget.id ? { ...c, replied: true, read: true } : c)));
          setReplyTarget(null);
          setReplyBody("");
        }
      } else if (res.status === 202 || data.status === "delivery-unknown") {
        if (mounted.current) setReplyError(t("inbox.delivery_unknown"));
      } else {
        if (mounted.current) setReplyError(data.error?.message ?? t("inbox.load_failed"));
      }
    } catch {
      if (mounted.current) setReplyError(t("inbox.load_failed"));
    } finally {
      if (mounted.current) setReplySending(false);
    }
  };

  const patchComment = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/inbox/comments/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok && mounted.current) {
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    }
  };

  const handleAnalyze = async (comment: Comment) => {
    try {
      const res = await fetch("/api/ai/sentiment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment.body }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { sentiment?: "positive" | "neutral" | "negative" };
      const next = data.sentiment === "positive" || data.sentiment === "negative" ? data.sentiment : "neutral";
      // Persisted (with manual provenance) — never frontend-only.
      await patchComment(comment.id, { sentiment: next });
    } catch {
      /* ignore */
    }
  };

  const handleDeleteProvider = async (comment: Comment) => {
    if (!window.confirm(t("inbox.delete_confirm"))) return;
    const res = await fetch(`/api/inbox/comments/${comment.id}/delete`, { method: "POST", credentials: "include" });
    if (res.ok && mounted.current) {
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      window.alert(data.error?.message ?? t("inbox.load_failed"));
    }
  };

  const handleSendDm = async () => {
    if (!activeConvo || dmSending) return;
    const body = (drafts[activeConvo] ?? "").trim();
    if (!body) return;
    setDmSending(true);
    setDmError(null);
    try {
      const res = await fetch("/api/inbox/messages/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvo, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; status?: string; draftId?: string };
      if (res.ok || res.status === 201) {
        // Draft is cleared only on confirmed send; thread reloaded from truth.
        if (mounted.current) {
          setDrafts((prev) => ({ ...prev, [activeConvo]: "" }));
          await loadThread(activeConvo);
        }
      } else if (res.status === 202 || data.status === "delivery-unknown") {
        if (mounted.current) {
          setDmError(t("inbox.delivery_unknown"));
          await loadThread(activeConvo);
        }
      } else {
        // Draft preserved in state — nothing is lost.
        if (mounted.current) setDmError(data.error?.message ?? t("inbox.delivery_failed"));
      }
    } catch {
      if (mounted.current) setDmError(t("inbox.delivery_failed"));
    } finally {
      if (mounted.current) setDmSending(false);
    }
  };

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (tab === "comments") {
      const csv = toCsv(
        filtered.map((c) => ({
          id: c.id,
          author: c.authorHandle,
          platform: c.platform,
          sentiment: c.sentiment ?? "",
          text: c.body,
          date: c.sentAt,
          replied: c.replied === true,
          resolved: c.resolved === true,
        }))
      );
      downloadCsv(`inbox-comments-${today}.csv`, csv);
    } else {
      const csv = toCsv(
        conversations.map((c) => ({
          id: c.id,
          participants: c.participants.join("; "),
          platform: c.platform,
          lastMessageAt: c.lastMessageAt,
          unread: c.unreadCount > 0,
        }))
      );
      downloadCsv(`inbox-messages-${today}.csv`, csv);
    }
  };

  const instagramConnected = capabilities.some((c) => c.platform === "instagram" && c.connected);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 p-3 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">{t("inbox.page_title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("inbox.page_subtitle")}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {lastSync ? t("inbox.last_sync", { time: shortDate(lastSync) }) : t("inbox.never_synced")}
            </span>
            {stale ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                <AlertTriangle className="size-3" />
                {t("inbox.stale")}
              </span>
            ) : null}
            {syncNote ? <span className="text-zinc-400">{syncNote}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            chips={[
              {
                key: "status",
                label: t("inbox.status"),
                value: statusFilter,
                options: [
                  { value: "all", label: t("inbox.all") },
                  { value: "unread", label: t("inbox.unread") },
                  { value: "unresolved", label: t("inbox.unresolved") },
                ],
                onChange: (v) => setStatusFilter(v as StatusFilter),
              },
              {
                key: "sentiment",
                label: t("inbox.all_sentiment"),
                value: sentimentFilter,
                options: [
                  { value: "all", label: t("inbox.all") },
                  { value: "positive", label: t("inbox.positive") },
                  { value: "neutral", label: t("inbox.neutral") },
                  { value: "negative", label: t("inbox.negative") },
                ],
                onChange: (v) => setSentimentFilter(v as SentimentFilter),
              },
              {
                key: "account",
                label: t("inbox.no_account_filter"),
                value: accountFilter,
                options: [
                  { value: "all", label: t("inbox.all") },
                  ...connectedAccounts.map(([key]) => ({ value: key, label: key })),
                ],
                onChange: setAccountFilter,
              },
            ]}
          />
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing || !canWrite}
            title={!canWrite ? t("inbox.permission_required") : undefined}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            {syncing ? t("inbox.syncing") : t("inbox.refresh")}
          </button>
          {canWrite ? (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="size-3.5" />
              {t("inbox.export_csv")}
            </button>
          ) : null}
        </div>
      </div>

      {state.kind === "quota" || state.kind === "rate-limited" ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{state.message}</p>
            <button type="button" onClick={() => load(false)} className="mt-1 underline">
              {t("inbox.retry")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1 border-b border-zinc-200">
        {(
          [
            { id: "comments", label: t("inbox.tab_comments"), icon: MessageSquare },
            { id: "messages", label: t("inbox.tab_messages"), icon: Mail },
          ] as { id: Tab; label: string; icon: typeof Mail }[]
        ).map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            aria-pressed={tab === tabItem.id}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === tabItem.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
            )}
          >
            <tabItem.icon className="size-4" />
            {tabItem.label}
          </button>
        ))}
        <div className="ml-auto hidden items-center gap-1.5 pb-2 text-xs text-zinc-400 md:flex">
          <Sparkles className="size-3.5" />
          {autodm === null ? null : autodm.enabled ? t("inbox.autodm_on", { n: autodm.count }) : t("inbox.autodm_off")}
        </div>
      </div>

      {state.kind === "loading" ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
            <p className="text-sm">{t("inbox.loading")}</p>
          </div>
        </div>
      ) : state.kind === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <CloudOff className="size-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">{state.message}</p>
          <button
            type="button"
            onClick={() => load(false)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
          >
            {t("inbox.retry")}
          </button>
        </div>
      ) : !instagramConnected && comments.length === 0 && conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Lock className="size-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">{t("inbox.disconnected")}</p>
          <p className="max-w-sm text-xs text-zinc-500">{t("inbox.disconnected_sub")}</p>
        </div>
      ) : tab === "comments" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("inbox.search_placeholder")}
              aria-label={t("inbox.search_placeholder")}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <p className="mt-1 text-[11px] text-zinc-400">{t("inbox.search_scope")}</p>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
              <CheckCheck className="size-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-700">{t("inbox.empty_title")}</p>
              <p className="text-xs text-zinc-500">{t("inbox.comments_empty_sub")}</p>
            </div>
          ) : (
            <>
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {filtered.map((c) => {
                const eligible = isPrivateReplyEligible(c.sentAt);
                const canPublic = canWrite && opStatus(c.platform, "reply-public") === "supported";
                const canPrivate = canWrite && opStatus(c.platform, "reply-private") === "supported";
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "rounded-lg border bg-white p-3",
                      activeComment === c.id ? "border-zinc-900" : "border-zinc-200",
                      !c.read && !c.replied && "border-l-4 border-l-zinc-900"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveComment(c.id);
                        if (!c.read) void patchComment(c.id, { read: true });
                      }}
                      className="flex w-full items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      <PlatformAvatar
                        platform={{ id: c.platform as PlatformId, name: platformName(c.platform), handle: c.authorHandle, avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
                        size={28}
                        rounded="full"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-zinc-900">{c.authorHandle}</span>
                          <span className="text-[11px] text-zinc-400">{shortDate(c.sentAt)}</span>
                          {c.sentiment ? (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">{c.sentiment}</span>
                          ) : null}
                          {c.resolved ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{t("inbox.resolved")}</span>
                          ) : null}
                          {c.replied ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400">
                              <Check className="size-3" />
                              {t("inbox.replied")}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-sm text-zinc-700">{c.body}</span>
                        {c.postPermalink ? (
                          <a
                            href={c.postPermalink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 underline"
                          >
                            {t("inbox.view_original")}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </span>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-10">
                      <button
                        type="button"
                        disabled={!canPublic}
                        title={!canPublic ? t("inbox.unsupported_op") : undefined}
                        onClick={() => openReply(c, "public-reply")}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 px-2 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40"
                      >
                        <Reply className="size-3.5" />
                        {t("inbox.reply_public")}
                      </button>
                      <button
                        type="button"
                        disabled={!canPrivate}
                        title={!eligible ? t("inbox.window_expired") : !canPrivate ? t("inbox.unsupported_op") : t("inbox.private_window_note")}
                        onClick={() => openReply(c, "private-reply")}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 px-2 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40"
                      >
                        <Mail className="size-3.5" />
                        {t("inbox.reply_private")}
                      </button>
                      {!eligible ? <span className="text-[11px] text-zinc-400">{t("inbox.window_expired")}</span> : null}
                      <button
                        type="button"
                        onClick={() => handleAnalyze(c)}
                        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-100"
                      >
                        <Sparkles className="size-3.5" />
                        {t("inbox.analyze")}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(c.body).catch(() => undefined)}
                        aria-label={t("inbox.copy_comment")}
                        className="inline-flex h-7 items-center rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-100"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            onClick={() => patchComment(c.id, { resolved: !c.resolved })}
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-100"
                          >
                            <CheckCheck className="size-3.5" />
                            {c.resolved ? t("inbox.reopen") : t("inbox.resolve")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProvider(c)}
                            title={t("inbox.delete_provider")}
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            {commentsCursor ? (
              <button type="button" onClick={() => void loadMore("comments")} disabled={loadingMore} className="self-center rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                {loadingMore ? t("inbox.loading") : "Load more comments"}
              </button>
            ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[280px_1fr]">
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                <Mail className="size-8 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">{t("inbox.messages_empty")}</p>
                <p className="text-xs text-zinc-500">{t("inbox.messages_empty_sub")}</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => loadThread(c.id)}
                  aria-pressed={activeConvo === c.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                    activeConvo === c.id ? "border-zinc-900 bg-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
                  )}
                >
                  <PlatformAvatar
                    platform={{ id: c.platform as PlatformId, name: platformName(c.platform), handle: c.participants[0] ?? "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
                    size={28}
                    rounded="full"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{c.participants[0] ?? t("inbox.no_message_yet")}</span>
                      {c.unreadCount > 0 ? (
                        <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">{c.unreadCount}</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">{shortDate(c.lastMessageAt)}</span>
                  </span>
                </button>
              ))
            )}
            {conversationsCursor ? (
              <button type="button" onClick={() => void loadMore("messages")} disabled={loadingMore} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                {loadingMore ? t("inbox.loading") : "Load more conversations"}
              </button>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white">
            {!activeConvo ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                <MessageSquare className="size-8 text-zinc-300" />
                <p className="text-sm font-medium">{t("inbox.select_conversation")}</p>
                <p className="text-xs text-zinc-500">{t("inbox.select_conversation_sub")}</p>
              </div>
            ) : (
              <>
                {(() => {
                  const convo = conversations.find((c) => c.id === activeConvo);
                  const lastInbound = convo?.lastInboundAt ? new Date(convo.lastInboundAt).getTime() : NaN;
                  const windowOk = !Number.isNaN(lastInbound) && Date.now() - lastInbound <= 24 * 60 * 60 * 1000;
                  const windowKnown = !Number.isNaN(lastInbound);
                  return (
                    <div className="border-b border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                      {!windowKnown
                        ? t("inbox.dm_window_unknown")
                        : windowOk
                          ? null
                          : t("inbox.dm_window_expired")}
                    </div>
                  );
                })()}
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
                  {threadLoading ? (
                    <p className="text-center text-xs text-zinc-400">{t("inbox.loading")}</p>
                  ) : thread.length === 0 ? (
                    <p className="text-center text-xs text-zinc-400">{t("inbox.no_messages")}</p>
                  ) : (
                    thread.map((m) => {
                      const out = m.direction === "out";
                      return (
                        <div key={m.id} className={cn("flex", out ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                              out ? "rounded-br-sm bg-zinc-900 text-white" : "rounded-bl-sm bg-zinc-100 text-zinc-900"
                            )}
                          >
                            <p>{m.body}</p>
                            <p className={cn("mt-0.5 text-[10px]", out ? "text-zinc-300" : "text-zinc-400")}>
                              {shortDate(toDateStr(m.sentAt))}
                              {out && m.deliveryStatus && m.deliveryStatus !== "sent" ? (
                                <span className="ml-1.5 font-medium">
                                  {m.deliveryStatus === "failed" ? `· ${t("inbox.delivery_failed")}` : m.deliveryStatus === "delivery-unknown" ? `· ${t("inbox.delivery_unknown")}` : `· ${m.deliveryStatus}`}
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {dmError ? (
                  <p className="flex items-center gap-1 px-3 pb-1 text-xs text-red-600" role="alert">
                    <AlertTriangle className="size-3.5" />
                    {dmError}
                  </p>
                ) : null}
                <div className="flex items-end gap-2 border-t border-zinc-200 p-3">
                  <label htmlFor="dm-composer" className="sr-only">
                    {t("inbox.message_placeholder")}
                  </label>
                  <textarea
                    id="dm-composer"
                    value={drafts[activeConvo] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [activeConvo]: e.target.value.slice(0, 8000) }))}
                    placeholder={t("inbox.message_placeholder")}
                    rows={2}
                    disabled={!canWrite}
                    className="min-h-10 flex-1 resize-none rounded-md border border-zinc-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSendDm}
                    disabled={dmSending || !canWrite || !(drafts[activeConvo] ?? "").trim()}
                    className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {dmSending ? t("inbox.sending") : t("inbox.send")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {replyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReplyTarget(null)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label={t("inbox.reply_title", { author: replyTarget.authorHandle })} className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900">{t("inbox.reply_title", { author: replyTarget.authorHandle })}</h2>
                <p className="mt-0.5 max-w-[420px] truncate text-xs text-zinc-500">“{replyTarget.body}”</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                aria-label={t("inbox.close")}
                className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-1 border-b border-zinc-200 px-5 pt-3">
              {(
                [
                  { id: "public-reply", label: t("inbox.reply_public") },
                  { id: "private-reply", label: t("inbox.reply_private") },
                ] as { id: ReplyKind; label: string }[]
              ).map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setReplyKind(k.id)}
                  aria-pressed={replyKind === k.id}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2 text-xs font-medium",
                    replyKind === k.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {replyKind === "private-reply" ? (
                <p className="mb-2 flex items-start gap-1 text-xs text-zinc-500">
                  {isPrivateReplyEligible(replyTarget.sentAt) ? (
                    <>
                      <Ban className="mt-0.5 size-3 shrink-0" />
                      {t("inbox.private_window_note")}
                    </>
                  ) : (
                    <span className="font-medium text-amber-700">{t("inbox.window_expired")}</span>
                  )}
                </p>
              ) : null}
              {replyError ? (
                <p className="mb-2 flex items-start gap-1 text-xs text-red-600" role="alert">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {replyError}
                </p>
              ) : null}
              <label htmlFor="reply-body" className="sr-only">
                {t("inbox.reply_placeholder")}
              </label>
              <textarea
                id="reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value.slice(0, 4000))}
                placeholder={t("inbox.reply_placeholder")}
                autoFocus
                className="h-32 w-full resize-none rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <div className="mt-1 text-right text-xs text-zinc-500">{t("inbox.chars_left", { remaining: 4000 - replyBody.length })}</div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-zinc-200 bg-zinc-50 px-5 py-3">
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={aiDrafting}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                {aiDrafting ? t("inbox.drafting") : t("inbox.draft_ai")}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-200/50"
                >
                  {t("inbox.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replySending || !replyBody.trim() || (replyKind === "private-reply" && !isPrivateReplyEligible(replyTarget.sentAt))}
                  className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {replySending ? t("inbox.sending") : t("inbox.send_reply")}
                </button>
              </div>
            </div>
            {replyBody ? <p className="px-5 pb-2 text-[11px] text-zinc-400">{t("inbox.human_review")}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Tag className="size-3" />
        <span>Instagram V1</span>
        <span aria-hidden>·</span>
        <div className="flex items-center gap-1">
          {PLATFORMS.filter((p) => p.id === "instagram").map((p) => (
            <PlatformAvatar key={p.id} platform={p} size={16} rounded="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
