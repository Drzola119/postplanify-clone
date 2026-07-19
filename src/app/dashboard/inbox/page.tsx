"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import {
  Search,
  Reply,
  ChevronDown,
  Inbox as InboxIcon,
  SlidersHorizontal,
  Check,
  Tag,
  Copy,
  Hash,
  MoreVertical,
  Mail,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown,
  Calendar,
  MessageCircle,
  MessagesSquare,
  Activity,
  CircleDot,
  BarChart3,
  PieChart,
  AtSign,
  Clock,
  Sparkles,
  Download,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";

type Tab = "comments" | "messages" | "insights";
type Filter = "all" | "unread" | "open";
type Sentiment = "positive" | "neutral" | "negative";
type Range = "7d" | "30d" | "90d" | "6m" | "1y";

interface Comment {
  id: string;
  avatar: string;
  thumbnail: string;
  author: string;
  date: string;
  sentiment: Sentiment;
  text: string;
  unread: boolean;
  platform: "instagram" | "twitter" | "tiktok" | "linkedin" | "facebook" | "threads" | "youtube" | "pinterest" | "bluesky";
  autoRepliedByCampaignId?: string;
}

interface ApiComment {
  id: string;
  platform?: string;
  postId?: string;
  authorHandle?: string;
  body?: string;
  sentAt?: string;
  sentiment?: Sentiment;
  replied?: boolean;
  autoRepliedByCampaignId?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  platform: "instagram" | "twitter" | "tiktok" | "linkedin" | "facebook" | "threads" | "youtube" | "pinterest" | "bluesky";
}

interface ApiConversation {
  id: string;
  platform?: string;
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

const PLATFORM_LABEL: Record<Comment["platform"], string> = {
  instagram: "Instagram",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  threads: "Threads",
  youtube: "YouTube",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
};

const SUPPORTED_PLATFORMS: Comment["platform"][] = [
  "instagram",
  "twitter",
  "tiktok",
  "linkedin",
  "facebook",
  "threads",
  "youtube",
  "pinterest",
  "bluesky",
];

const COMMENTS: Comment[] = [
  {
    id: "c1",
    avatar: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-178",
    thumbnail: "https://scontent-ams2-1.cdninstagram.com/v/t51.82787-15/702962414_18108640072753132_3315258442800831",
    author: "@euro_aura__",
    date: "19/05/2026",
    sentiment: "positive",
    text: "Nice post! Could you share this with me ?",
    unread: false,
    platform: "instagram",
  },
];

const CONVERSATIONS: Conversation[] = [];

export default function InboxPage() {
  const t = useTranslations("dashboard");
  const [tab, setTab] = useState<Tab>("comments");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [range, setRange] = useState<Range>("90d");
  const [activeComment, setActiveComment] = useState<string | null>("c1");
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch("/api/inbox/comments", { credentials: "include" }),
          fetch("/api/inbox/messages", { credentials: "include" }),
        ]);
        if (cancelled) return;
        if (cRes.ok) {
          const cData = (await cRes.json()) as { comments?: ApiComment[] };
          const mapped = (cData.comments ?? []).map<Comment>((c) => ({
            id: c.id,
            avatar: c.authorHandle?.[0]?.toUpperCase() ?? "?",
            thumbnail: "",
            author: c.authorHandle ?? "unknown",
            date: c.sentAt ?? new Date().toISOString(),
            sentiment: c.sentiment ?? "neutral",
            text: c.body ?? "",
            unread: !c.replied,
            platform: (c.platform ?? "instagram") as Comment["platform"],
            autoRepliedByCampaignId: c.autoRepliedByCampaignId,
          }));
          if (mapped.length > 0) setComments(mapped);
        }
        if (mRes.ok) {
          const mData = (await mRes.json()) as { conversations?: ApiConversation[] };
          const mapped = (mData.conversations ?? []).map<Conversation>((c) => ({
            id: c.id,
            name: c.participants?.[0] ?? "unknown",
            avatar: c.participants?.[0]?.[0]?.toUpperCase() ?? "?",
            lastMessage: c.lastMessage ?? "",
            time: c.lastMessageAt ?? new Date().toISOString(),
            unread: (c.unreadCount ?? 0) > 0,
            platform: (c.platform ?? "instagram") as Conversation["platform"],
          }));
          if (mapped.length > 0) setConversations(mapped);
        }
      } catch {
        // offline — keep seed
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendReply = async (body: string) => {
    if (!replyTarget || replySending) return;
    setReplySending(true);
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: replyTarget.id,
          platform: replyTarget.platform,
          body,
        }),
      });
      if (res.ok) {
        setComments((prev) => prev.map((c) => (c.id === replyTarget.id ? { ...c, unread: false } : c)));
        setReplyTarget(null);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(data.error ?? "Failed to send reply");
      }
    } finally {
      setReplySending(false);
    }
  };

  const handleArchiveComment = async (commentId: string) => {
    const res = await fetch(`/api/inbox/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (replyTarget?.id === commentId) setReplyTarget(null);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Failed to archive");
    }
  };

  const filtered = useMemo(() => {
    let list = comments;
    if (filter === "unread") list = list.filter((c) => c.unread);
    if (platformFilter !== "all") list = list.filter((c) => c.platform === platformFilter);
    if (search) list = list.filter((c) => c.text.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [comments, filter, platformFilter, search]);

  const analyzeSentiment = async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId);
    if (!target || analyzingId) return;
    setAnalyzingId(commentId);
    try {
      const res = await fetch("/api/ai/sentiment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: target.text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { sentiment?: Sentiment };
        const next: Sentiment = data.sentiment === "positive" || data.sentiment === "negative" ? data.sentiment : "neutral";
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, sentiment: next } : c)));
      }
    } catch {
      /* ignore */
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (tab === "comments") {
      const csv = toCsv(filtered.map((c) => ({
        id: c.id,
        author: c.author,
        platform: c.platform,
        sentiment: c.sentiment,
        text: c.text,
        date: c.date,
        unread: c.unread,
        replied: !c.unread,
      })));
      downloadCsv(`inbox-comments-${today}.csv`, csv);
    } else if (tab === "messages") {
      const csv = toCsv(conversations.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        lastMessage: c.lastMessage,
        time: c.time,
        unread: c.unread,
      })));
      downloadCsv(`inbox-messages-${today}.csv`, csv);
    } else {
      const csv = toCsv(filtered.map((c) => ({
        id: c.id,
        author: c.author,
        platform: c.platform,
        sentiment: c.sentiment,
        text: c.text,
        date: c.date,
      })));
      downloadCsv(`inbox-insights-${today}.csv`, csv);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 p-3 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">{t("inbox.page_title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("inbox.page_subtitle")}</p>
        </div>
        <FilterBar
          chips={[
            {
              key: "platform",
              label: t("inbox.platform"),
              value: platformFilter,
              options: [
                { value: "all", label: t("inbox.all_platforms") },
                ...SUPPORTED_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] })),
              ],
              onChange: setPlatformFilter,
            },
            {
              key: "status",
              label: t("inbox.status"),
              value: filter,
              options: [
                { value: "all", label: t("inbox.all") },
                { value: "unread", label: t("inbox.unread") },
                { value: "open", label: t("inbox.open") },
              ],
              onChange: (v) => setFilter(v as Filter),
            },
          ]}
        />
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Download className="size-3.5" />
          {t("inbox.export_csv")}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>supported</span>
          <div className="flex items-center gap-1">
            {SUPPORTED_PLATFORMS.map((p) => (
              <PlatformAvatar
                key={p}
                platform={{ id: p, name: PLATFORM_LABEL[p] ?? p, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
                size={18}
                rounded="sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
          {([
            { id: "comments", label: t("inbox.tab_comments") },
            { id: "messages", label: t("inbox.tab_messages") },
            { id: "insights", label: t("inbox.tab_insights"), badge: t("inbox.tab_new") },
           ] as { id: Tab; label: string; badge?: string }[]).map((tabItem) => (
           <button
             key={tabItem.id}
             type="button"
             onClick={() => setTab(tabItem.id)}
             className={cn(
               "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
               tab === tabItem.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
             )}
           >
             {tabItem.label}
             {tabItem.badge && (
               <span className="inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-[9px] leading-[14px] font-semibold uppercase tracking-wide text-white">
                 {tabItem.badge}
               </span>
             )}
           </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="size-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
            <p className="text-sm">{t("inbox.loading")}</p>
          </div>
        </div>
      ) : tab === "comments" ? (
        <CommentsTab
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          comments={filtered}
          activeId={activeComment}
          setActiveId={setActiveComment}
          analyzingId={analyzingId}
          onAnalyze={analyzeSentiment}
          onOpenReply={(c) => setReplyTarget(c)}
          onArchive={(c) => handleArchiveComment(c.id)}
        />
      ) : tab === "messages" ? (
        <MessagesTab
          filter={filter}
          setFilter={setFilter}
          conversations={conversations}
          activeId={activeConvo}
          setActiveId={setActiveConvo}
        />
      ) : (
        <InsightsTab range={range} setRange={setRange} comments={comments} />
      )}

      {/* Reply modal */}
      {replyTarget ? (
        <ReplyModal
          comment={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSubmit={handleSendReply}
          sending={replySending}
        />
      ) : null}
    </div>
  );
}

function ReplyModal({
  comment,
  onClose,
  onSubmit,
  sending,
}: {
  comment: Comment;
  onClose: () => void;
  onSubmit: (body: string) => Promise<void> | void;
  sending: boolean;
}) {
  const t = useTranslations("dashboard");
  const [body, setBody] = useState("");
  const max = 2200;
  const remaining = max - body.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{t("inbox.reply_title", { author: comment.author })}</h2>
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[420px]">
              “{comment.text}”
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center size-7 rounded-md hover:bg-zinc-100 text-zinc-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, max))}
            placeholder={t("inbox.reply_placeholder")}
            className="w-full h-32 rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
            autoFocus
          />
          <div className="mt-1 text-right text-xs text-zinc-500">{t("inbox.chars_left", { remaining })}</div>
        </div>
        <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-end gap-2 bg-zinc-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {t("inbox.cancel")}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(body)}
            disabled={!body.trim() || sending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 h-9 text-sm font-medium"
          >
            <Reply className="size-3.5" />
            {sending ? t("inbox.sending") : t("inbox.send_reply")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== COMMENTS TAB ============================== */

function CommentsTab({
  filter,
  setFilter,
  search,
  setSearch,
  comments,
  activeId,
  setActiveId,
  analyzingId,
  onAnalyze,
  onOpenReply,
  onArchive,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  search: string;
  setSearch: (s: string) => void;
  comments: Comment[];
  activeId: string | null;
  setActiveId: (id: string) => void;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  onOpenReply: (c: Comment) => void;
  onArchive: (c: Comment) => void;
}) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <FilterRow filter={filter} setFilter={setFilter} showSentiment />
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="px-3 py-3 border-b border-zinc-200 flex items-center gap-3">
          <button
            type="button"
            aria-label="Filter view"
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-zinc-100 text-zinc-500"
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("inbox.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {comments.length === 0 ? (
            <EmptyState
              icon={<InboxIcon className="size-10" />}
              title={t("inbox.comments_empty")}
              subtitle={t("inbox.comments_empty_sub")}
            />
          ) : (
            comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                active={activeId === c.id}
                onClick={() => setActiveId(c.id)}
                analyzing={analyzingId === c.id}
                onAnalyze={() => onAnalyze(c.id)}
                onOpenReply={onOpenReply}
                onArchive={onArchive}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  active,
  onClick,
  analyzing,
  onAnalyze,
  onOpenReply,
  onArchive,
}: {
  comment: Comment;
  active: boolean;
  onClick: () => void;
  analyzing: boolean;
  onAnalyze: () => void;
  onOpenReply?: (c: Comment) => void;
  onArchive?: (c: Comment) => void;
}) {
  const t = useTranslations("dashboard");
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 hover:bg-zinc-50 cursor-pointer transition-colors",
        active && "bg-blue-50/40 border-l-2 border-l-blue-600"
      )}
    >
      <input
        type="checkbox"
        aria-label="Select comment"
        className="size-4 shrink-0 rounded border-zinc-300 accent-zinc-900"
        onClick={(e) => e.stopPropagation()}
      />
      <img
        src={comment.avatar}
        alt={comment.author}
        className="size-9 shrink-0 rounded-full ring-1 ring-zinc-200 object-cover"
        loading="lazy"
      />
      <img
        src={comment.thumbnail}
        alt="post"
        className="size-10 shrink-0 rounded object-cover bg-zinc-100"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm", comment.unread ? "font-bold" : "font-semibold")}>{comment.author}</span>
          <span className="text-[11px] text-zinc-500">{comment.date}</span>
          <SentimentBadge sentiment={comment.sentiment} />
          {comment.autoRepliedByCampaignId ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 px-2 py-0.5 text-[11px] font-medium"
              title={`Auto-replied by campaign ${comment.autoRepliedByCampaignId}`}
            >
              <Wand2 className="size-3" />
              {t("inbox.auto_replied")}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-zinc-700 truncate mt-0.5">{comment.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-7 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          title={t("inbox.analyze_sentiment")}
        >
          <Sparkles className="size-3" />
          {analyzing ? t("inbox.analyzing") : t("inbox.analyze")}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenReply?.(comment);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 h-7 text-xs font-medium hover:bg-zinc-800"
        >
          <Reply className="size-3" />
          {t("inbox.reply")}
        </button>
        <IconBtn aria-label={t("inbox.assign_label")} onClick={(e) => e.stopPropagation()}><Tag className="size-3.5" /></IconBtn>
        <IconBtn aria-label={t("inbox.copy_comment")} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(comment.text); }}><Copy className="size-3.5" /></IconBtn>
        <IconBtn aria-label={t("inbox.archive")} onClick={(e) => { e.stopPropagation(); onArchive?.(comment); }}><InboxIcon className="size-3.5" /></IconBtn>
        <IconBtn aria-label={t("inbox.more")} onClick={(e) => e.stopPropagation()}><MoreVertical className="size-3.5" /></IconBtn>
      </div>
    </div>
  );
}

/* ============================== MESSAGES TAB ============================== */

function MessagesTab({
  filter,
  setFilter,
  conversations,
  activeId,
  setActiveId,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  conversations: Conversation[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const t = useTranslations("dashboard");
  const [thread, setThread] = useState<Array<{ id: string; fromHandle: string; body: string; sentAt: string; direction: "in" | "out" }>>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  useEffect(() => {
    if (!activeId) {
      setThread([]);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    (async () => {
      try {
        const res = await fetch(`/api/inbox/messages?conversationId=${encodeURIComponent(activeId)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setThread([]);
          return;
        }
        const data = (await res.json()) as { messages?: Array<{ fromHandle?: string; body?: string; sentAt?: string; direction?: "in" | "out" }> };
        if (cancelled) return;
        setThread(
          (data.messages ?? []).map((m, i) => ({
            id: `${activeId}-${i}`,
            fromHandle: m.fromHandle ?? "unknown",
            body: m.body ?? "",
            sentAt: m.sentAt ?? new Date().toISOString(),
            direction: (m.direction ?? "in") as "in" | "out",
          })),
        );
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function sendDraft() {
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/messages/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, body: draft.trim(), direction: "out" }),
      });
      if (res.ok) {
        setDraft("");
        // Re-load thread.
        const r = await fetch(`/api/inbox/messages?conversationId=${encodeURIComponent(activeId)}`, {
          credentials: "include",
        });
        if (r.ok) {
          const data = (await r.json()) as { messages?: Array<{ fromHandle?: string; body?: string; sentAt?: string; direction?: "in" | "out" }> };
          setThread(
            (data.messages ?? []).map((m, i) => ({
              id: `${activeId}-${i}`,
              fromHandle: m.fromHandle ?? "unknown",
              body: m.body ?? "",
              sentAt: m.sentAt ?? new Date().toISOString(),
              direction: (m.direction ?? "in") as "in" | "out",
            })),
          );
        }
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(data.error ?? "Failed to send");
      }
    } finally {
      setSending(false);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <FilterRow filter={filter} setFilter={setFilter} showSentiment={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col min-h-[500px]">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="size-10" />}
              title={t("inbox.messages_empty")}
              subtitle={t("inbox.messages_empty_sub")}
              full
            />
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-start gap-3",
                    activeId === c.id && "bg-blue-50/40 border-l-2 border-l-blue-600"
                  )}
                >
                  <span className="size-10 rounded-full bg-zinc-200 inline-flex items-center justify-center font-semibold text-zinc-700">
                    {c.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm truncate", c.unread ? "font-bold" : "font-semibold")}>{c.name}</p>
                      <span className="text-[11px] text-zinc-500 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.lastMessage || t("inbox.no_message_yet")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col min-h-[500px]">
          {activeId === null ? (
            <EmptyState
              icon={<MessagesSquare className="size-10" />}
              title={t("inbox.select_conversation")}
              subtitle={t("inbox.select_conversation_sub")}
              full
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {active ? (
                <div className="px-4 py-3 border-b border-zinc-200">
                  <p className="text-sm font-semibold">{active.name}</p>
                  <p className="text-xs text-zinc-500">{active.platform}</p>
                </div>
              ) : null}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <p className="text-sm text-zinc-500 text-center py-8">{t("inbox.loading")}</p>
                ) : thread.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">{t("inbox.no_messages")}</p>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        m.direction === "out"
                          ? "ml-auto bg-zinc-900 text-white"
                          : "mr-auto bg-zinc-100 text-zinc-900",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn("mt-1 text-[10px]", m.direction === "out" ? "text-zinc-300" : "text-zinc-500")}>
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-zinc-200 p-3 flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("inbox.message_placeholder")}
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-zinc-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void sendDraft();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendDraft()}
                  disabled={!draft.trim() || sending}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
                >
                  {sending ? t("inbox.sending") : t("inbox.send")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== INSIGHTS TAB ============================== */

function InsightsTab({ range, setRange, comments }: { range: Range; setRange: (r: Range) => void; comments: Comment[] }) {
  const t = useTranslations("dashboard");
  const ranges: Range[] = ["7d", "30d", "90d", "6m", "1y"];
  const totalReplied = comments.filter((c) => !c.unread).length;
  const responseRate = comments.length === 0 ? 0 : Math.round((totalReplied / comments.length) * 100);
  const awaiting = comments.filter((c) => c.unread).length;
  const positive = comments.filter((c) => c.sentiment === "positive").length;
  const neutral = comments.filter((c) => c.sentiment === "neutral").length;
  const negative = comments.filter((c) => c.sentiment === "negative").length;
  const pct = (n: number) => (comments.length === 0 ? "0%" : `${Math.round((n / comments.length) * 100)}%`);
  const metrics = [
    { label: t("inbox.comments_received"), value: comments.length, sublabel: t("inbox.comments_received_sub"), Icon: MessageCircle, tone: "blue" },
    { label: t("inbox.dms_received"), value: 0, sublabel: t("inbox.dms_received_sub"), Icon: MessagesSquare, tone: "purple" },
    { label: t("inbox.response_rate"), value: `${responseRate}%`, sublabel: t("inbox.response_rate_sub"), Icon: Reply, tone: "green" },
    { label: t("inbox.awaiting_reply"), value: awaiting, sublabel: t("inbox.awaiting_reply_sub"), Icon: Clock, tone: "amber" },
    { label: t("inbox.positive"), value: pct(positive), sublabel: t("inbox.positive_sub"), Icon: Smile, tone: "emerald" },
    { label: t("inbox.neutral"), value: pct(neutral), sublabel: t("inbox.neutral_sub"), Icon: Meh, tone: "zinc" },
    { label: t("inbox.negative"), value: pct(negative), sublabel: t("inbox.negative_sub"), Icon: Frown, tone: "rose" },
  ];

  const toneColors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    zinc: "text-zinc-600 bg-zinc-100",
    rose: "text-rose-600 bg-rose-50",
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Date range pills */}
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                range === r ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {t(`inbox.d${r}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 bg-white shadow-sm p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className={cn("inline-flex items-center justify-center size-5 rounded", toneColors[m.tone])}>
                <m.Icon className="size-3" />
              </span>
              <span className="text-xs text-zinc-700 font-medium leading-tight">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 leading-tight">{m.value}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{m.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Comment volume chart */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">{t("inbox.comment_volume")}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
              <span className="font-bold">1</span>
              <span>{t("inbox.total_badge")}</span>
            </span>
          </div>
          <CommentVolumeChart />
        </div>

        {/* Where comments come from */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">{t("inbox.where_comments")}</h3>
          <PlatformDonut />
          <div className="flex items-center justify-between mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-pink-500" />
              <span className="text-zinc-700">Instagram</span>
            </div>
            <span className="font-bold text-zinc-900">100%</span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By platform */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">{t("inbox.by_platform")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PlatformAvatar
                platform={{ id: "instagram", name: "Instagram", handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
                size={24}
                rounded="sm"
              />
              <span className="text-sm font-medium flex-1">Instagram</span>
              <span className="text-sm text-zinc-500">1</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">{t("inbox.pct_replied", { pct: 0 })}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "0%" }} />
            </div>
          </div>
        </div>

        {/* Comment themes */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">{t("inbox.comment_themes")}</h3>
            <div className="flex items-center gap-2 text-[10px]">
              <Legend dot="bg-emerald-500" label={t("inbox.pos_label")} />
              <Legend dot="bg-amber-500" label={t("inbox.neu_label")} />
              <Legend dot="bg-rose-500" label={t("inbox.neg_label")} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-blue-50 text-blue-600">
              <MessageCircle className="size-3" />
            </span>
            <span className="text-sm font-medium flex-1">Questions</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
            </div>
            <span className="text-sm font-bold text-zinc-900">1</span>
            <span className="text-[11px] text-zinc-500">100%</span>
          </div>
        </div>

        {/* Sentiment over time */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">{t("inbox.sentiment_over_time")}</h3>
          <SentimentTimeChart />
        </div>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1 text-zinc-500">
      <span className={cn("size-1.5 rounded-full", dot)} />
      <span>{label}</span>
    </div>
  );
}

function CommentVolumeChart() {
  return (
    <div className="relative h-56 w-full">
      <svg viewBox="0 0 600 220" className="w-full h-full" aria-hidden>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="40" y1={20 + i * 45} x2="600" y2={20 + i * 45} stroke="#e4e4e7" strokeDasharray="2 4" strokeWidth="1" />
        ))}
        {/* Y-axis labels */}
        {[4, 3, 2, 1, 0].map((v, i) => (
          <text key={v} x="32" y={24 + i * 45} textAnchor="end" fill="#a1a1aa" fontSize="11">{v}</text>
        ))}
        {/* Single data point */}
        <circle cx="320" cy="155" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
        {/* X-axis label */}
        <text x="320" y="210" textAnchor="middle" fill="#71717a" fontSize="11">May 19</text>
      </svg>
    </div>
  );
}

function PlatformDonut() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 160 }}>
      <svg viewBox="0 0 100 100" className="size-32 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f4f4f5" strokeWidth="14" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#ec4899"
          strokeWidth="14"
          strokeDasharray="251.327 251.327"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SentimentTimeChart() {
  return (
    <div className="relative h-44 w-full">
      <svg viewBox="0 0 600 200" className="w-full h-full" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="40" y1={20 + i * 40} x2="600" y2={20 + i * 40} stroke="#e4e4e7" strokeDasharray="2 4" strokeWidth="1" />
        ))}
        {[4, 3, 2, 1, 0].map((v, i) => (
          <text key={v} x="32" y={24 + i * 40} textAnchor="end" fill="#a1a1aa" fontSize="11">{v}</text>
        ))}
        <circle cx="320" cy="140" r="5" fill="#f43f5e" stroke="white" strokeWidth="2" />
        <text x="320" y="190" textAnchor="middle" fill="#71717a" fontSize="11">May 19</text>
      </svg>
    </div>
  );
}

/* ============================== SHARED PARTS ============================== */

function FilterRow({
  filter,
  setFilter,
  showSentiment,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  showSentiment: boolean;
}) {
  const t = useTranslations("dashboard");
  const filters: Filter[] = ["all", "unread", "open"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label="Filter view"
        className="inline-flex items-center justify-center size-8 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500"
      >
        <SlidersHorizontal className="size-4" />
      </button>
      <div className="inline-flex items-center gap-1 rounded-md bg-zinc-100 p-0.5">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 h-7 rounded text-xs font-medium transition-colors capitalize",
              filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {f === "all" ? t("inbox.filter_all") : f === "unread" ? t("inbox.filter_unread") : t("inbox.filter_open")}
          </button>
        ))}
      </div>
      <DropdownPill label={t("inbox.all_accounts")} />
      <DropdownPill label={t("inbox.all_labels")} />
      {showSentiment && <DropdownPill label={t("inbox.all_sentiment")} />}
    </div>
  );
}

function DropdownPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white h-8 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 min-w-[150px]"
    >
      <span>{label}</span>
      <ChevronDown className="size-3.5 text-zinc-400" />
    </button>
  );
}

function IconBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center size-7 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
      {...rest}
    >
      {children}
    </button>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        sentiment === "positive" && "bg-emerald-50 text-emerald-700",
        sentiment === "neutral" && "bg-zinc-100 text-zinc-600",
        sentiment === "negative" && "bg-rose-50 text-rose-600"
      )}
    >
      {sentiment === "positive" && <Smile className="size-3" />}
      {sentiment === "neutral" && <Meh className="size-3" />}
      {sentiment === "negative" && <Frown className="size-3" />}
      {sentiment}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  full = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-zinc-400 text-center px-6 py-12",
        full && "flex-1 min-h-[400px]"
      )}
    >
      <div className="mb-3 text-zinc-300">{icon}</div>
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
}