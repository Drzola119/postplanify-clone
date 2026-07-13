"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const PLATFORM_COLORS: Record<Comment["platform"], string> = {
  instagram: "from-purple-500 via-pink-500 to-orange-400",
  twitter: "bg-sky-500",
  tiktok: "bg-zinc-900",
  linkedin: "bg-blue-700",
  facebook: "bg-blue-600",
  threads: "bg-zinc-900",
  youtube: "bg-red-600",
  pinterest: "bg-red-500",
  bluesky: "bg-sky-400",
};

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

const PLATFORM_SVG: Record<Comment["platform"], ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.86a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1.84-.24z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.024 1.792-4.694 4.533-4.694 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.262h3.328l-.531 3.49h-2.797V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017C1.5 8.413 2.35 5.56 3.995 3.509 5.846 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.518-.029 1.002-.04 1.451-.034.014-.81-.072-1.5-.328-2.045-.34-.722-.999-1.108-1.844-1.085-.832.022-1.49.398-1.834 1.067l-1.793-1.107c.665-1.298 2.062-2.085 3.737-2.118 1.504-.025 2.713.553 3.42 1.658.515.81.728 1.86.7 3.063.092.024.184.05.276.078 1.392.42 2.466 1.276 3.108 2.485.713 1.348.81 3.111-.85 4.797-1.84 1.802-3.99 2.626-7.005 2.652h-.014zm-.116-12.7c-.31 0-.628.01-.957.028-1.495.083-2.65.731-2.79 1.495-.063.345.057.708.347 1.014.464.49 1.31.737 2.197.7.945-.05 1.638-.41 2.058-1.069.31-.49.43-1.13.345-1.91-.13-.014-.276-.022-.43-.026-.27-.014-.55-.022-.77-.022v-.21z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
  ),
  bluesky: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.911.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  ),
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
  const [tab, setTab] = useState<Tab>("comments");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("90d");
  const [activeComment, setActiveComment] = useState<string | null>("c1");
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [loading, setLoading] = useState(true);

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

  const filtered = useMemo(() => {
    let list = comments;
    if (filter === "unread") list = list.filter((c) => c.unread);
    if (search) list = list.filter((c) => c.text.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [comments, filter, search]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 p-3 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage comments and DMs across all your accounts</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>supported</span>
          <div className="flex items-center gap-1 text-zinc-700">
            {SUPPORTED_PLATFORMS.map((p) => (
              <span key={p} className={cn("inline-flex items-center justify-center text-white", PLATFORM_COLORS[p].split(" ")[0])} style={{ width: 18, height: 18, borderRadius: 4 }}>
                {PLATFORM_SVG[p]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {([
          { id: "comments", label: "Comments" },
          { id: "messages", label: "Messages" },
          { id: "insights", label: "Insights", badge: "NEW" },
        ] as { id: Tab; label: string; badge?: string }[]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
            )}
          >
            {t.label}
            {t.badge && (
              <span className="inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-[9px] leading-[14px] font-semibold uppercase tracking-wide text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "comments" && (
        <CommentsTab
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          comments={filtered}
          activeId={activeComment}
          setActiveId={setActiveComment}
        />
      )}
      {tab === "messages" && (
        <MessagesTab
          filter={filter}
          setFilter={setFilter}
          conversations={CONVERSATIONS}
          activeId={activeConvo}
          setActiveId={setActiveConvo}
        />
      )}
      {tab === "insights" && <InsightsTab range={range} setRange={setRange} />}
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
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  search: string;
  setSearch: (s: string) => void;
  comments: Comment[];
  activeId: string | null;
  setActiveId: (id: string) => void;
}) {
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
              placeholder="Search comments..."
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
              title="No comments yet"
              subtitle="When someone comments on your posts, they'll show up here."
            />
          ) : (
            comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                active={activeId === c.id}
                onClick={() => setActiveId(c.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CommentRow({ comment, active, onClick }: { comment: Comment; active: boolean; onClick: () => void }) {
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
        </div>
        <p className="text-sm text-zinc-700 truncate mt-0.5">{comment.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 h-7 text-xs font-medium hover:bg-zinc-800"
        >
          <Reply className="size-3" />
          Reply
        </button>
        <IconBtn aria-label="Assign label"><Tag className="size-3.5" /></IconBtn>
        <IconBtn aria-label="Copy comment"><Copy className="size-3.5" /></IconBtn>
        <IconBtn aria-label="Add hashtag"><Hash className="size-3.5" /></IconBtn>
        <IconBtn aria-label="Mention"><AtSign className="size-3.5" /></IconBtn>
        <IconBtn aria-label="More"><MoreVertical className="size-3.5" /></IconBtn>
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
  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <FilterRow filter={filter} setFilter={setFilter} showSentiment={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col min-h-[500px]">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="size-10" />}
              title="No conversations yet"
              subtitle="New direct messages will appear here in real-time."
              full
            />
          ) : (
            <div className="divide-y divide-zinc-100">
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
                  <img src={c.avatar} alt={c.name} className="size-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm truncate", c.unread ? "font-bold" : "font-semibold")}>{c.name}</p>
                      <span className="text-[11px] text-zinc-500 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.lastMessage}</p>
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
              title="Select a conversation"
              subtitle="Choose a message from the list to view and reply."
              full
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================== INSIGHTS TAB ============================== */

function InsightsTab({ range, setRange }: { range: Range; setRange: (r: Range) => void }) {
  const ranges: Range[] = ["7d", "30d", "90d", "6m", "1y"];
  const metrics = [
    { label: "Comments received", value: 1, sublabel: "total volume", Icon: MessageCircle, tone: "blue" },
    { label: "DMs received", value: 0, sublabel: "private messages", Icon: MessagesSquare, tone: "purple" },
    { label: "Response rate", value: "0%", sublabel: "of comments replied", Icon: Reply, tone: "green" },
    { label: "Awaiting reply", value: 1, sublabel: "unanswered", Icon: Clock, tone: "amber" },
    { label: "Positive", value: "100%", sublabel: "overall mood", Icon: Smile, tone: "emerald" },
    { label: "Neutral", value: "0%", sublabel: "neither way", Icon: Meh, tone: "zinc" },
    { label: "Negative", value: "0%", sublabel: "complaint pressure", Icon: Frown, tone: "rose" },
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
              {r}
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
            <h3 className="text-sm font-semibold text-zinc-900">Comment volume</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
              <span className="font-bold">1</span>
              <span>total</span>
            </span>
          </div>
          <CommentVolumeChart />
        </div>

        {/* Where comments come from */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Where comments come from</h3>
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
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">By platform</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-6 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white">
                {PLATFORM_SVG.instagram}
              </span>
              <span className="text-sm font-medium flex-1">Instagram</span>
              <span className="text-sm text-zinc-500">1</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">0% replied</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "0%" }} />
            </div>
          </div>
        </div>

        {/* Comment themes */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">Comment themes</h3>
            <div className="flex items-center gap-2 text-[10px]">
              <Legend dot="bg-emerald-500" label="Pos" />
              <Legend dot="bg-amber-500" label="Neu" />
              <Legend dot="bg-rose-500" label="Neg" />
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
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Sentiment over time</h3>
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
            {f === "all" ? "All" : f === "unread" ? "Unread" : "Open"}
          </button>
        ))}
      </div>
      <DropdownPill label="All accounts" />
      <DropdownPill label="All labels" />
      {showSentiment && <DropdownPill label="All sentiment" />}
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