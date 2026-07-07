"use client";

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Repeat,
  ThumbsUp,
  Share2,
  VolumeX,
  Music,
  MoreHorizontal,
  CheckCircle2,
  Globe,
  Sparkles,
  BarChart3,
  Plus,
} from "lucide-react";
import type { PlatformMeta } from "@/lib/platforms";

export interface PreviewProps {
  platform: PlatformMeta;
  caption: string;
  mediaUrl: string | null;
  mediaKind?: "image" | "video" | null;
}

// Shared atoms
function Avatar({ src, alt, size = 40, border = false }: { src: string | null; alt: string; size?: number; border?: boolean }) {
  const dim = `${size}px`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: dim, height: dim, border: border ? "2px solid #000" : undefined }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-xs font-semibold flex-shrink-0"
      style={{ width: dim, height: dim }}
    >
      {alt.slice(0, 2).toUpperCase()}
    </div>
  );
}

function VerifiedMark({ color = "#1d9bf0" }: { color?: string }) {
  return <CheckCircle2 className="w-4 h-4" style={{ color }} fill={color} stroke="#fff" />;
}

// Instagram
export function InstagramPreview({ platform, caption, mediaUrl, mediaKind }: PreviewProps) {
  return (
    <div className="w-[400px] bg-card shadow-lg flex flex-col rounded-xl max-h-screen overflow-y-auto p-2">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={platform.avatar} alt={platform.handle} size={32} />
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-sm hover:underline cursor-pointer truncate">
                {platform.handle}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Draft</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="text-sm font-semibold text-[#0095f6] hover:opacity-80" tabIndex={-1}>
            Follow
          </button>
          <MoreHorizontal className="w-5 h-5 text-foreground/70 cursor-pointer" />
        </div>
      </div>
      <div className="relative w-full aspect-[4/5] bg-black">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-white/40 text-sm">No media</div>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4">
          <Heart className="w-7 h-7 cursor-pointer" strokeWidth={1.5} />
          <MessageCircle className="w-7 h-7 cursor-pointer" strokeWidth={1.5} />
          <Send className="w-7 h-7 cursor-pointer" strokeWidth={1.5} />
        </div>
        <Bookmark className="w-7 h-7 cursor-pointer" strokeWidth={1.5} />
      </div>
      <div className="text-sm leading-5 whitespace-pre-wrap p-2">
        <span className="font-semibold mr-1">{platform.handle}</span>
        {caption}
      </div>
    </div>
  );
}

// Pinterest
export function PinterestPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button tabIndex={-1} aria-label="Like">
            <Heart className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <button tabIndex={-1} aria-label="Comment">
            <MessageCircle className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <button tabIndex={-1} aria-label="Share">
            <Share2 className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <MoreHorizontal className="w-5 h-5 cursor-pointer" />
          <span className="text-sm">PostPlanify</span>
          <span className="text-sm">▾</span>
          <button
            className="inline-flex items-center justify-center font-medium bg-red-600 text-white shadow-sm hover:bg-red-700 h-8 rounded-md px-3 text-xs"
            tabIndex={-1}
          >
            Save
          </button>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="grid grid-cols-3 text-center text-sm text-gray-600">
          <div>
            <div className="font-medium">Impressions</div>
            <div>0</div>
          </div>
          <div>
            <div className="font-medium">Pin clicks</div>
            <div>0</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 font-medium">
              <span>Saves</span>
            </div>
            <div>0</div>
          </div>
        </div>
        <div className="flex flex-col items-center py-2">
          <button className="text-xs text-gray-500 hover:underline" tabIndex={-1}>
            See more stats
          </button>
          <div className="mt-1 text-[10px] text-gray-400">Real-time estimates · Last 30 days</div>
        </div>
      </div>
      <div className="px-4 py-3 flex items-start justify-between">
        <div className="flex-1 pr-4"></div>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={platform.avatar} alt={platform.handle} size={24} />
          <span className="text-sm font-medium">{platform.handle}</span>
        </div>
        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800" tabIndex={-1}>
          <Bookmark className="w-4 h-4" strokeWidth={1.75} /> <span>Add to favorites</span>
        </button>
      </div>
      <div className="px-4 py-3 text-sm text-gray-500">{caption ? caption : "No description yet"}</div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-2">
          <input
            placeholder="Add a comment to start the conversation"
            className="flex-1 text-sm outline-none bg-transparent"
            type="text"
            tabIndex={-1}
            readOnly
          />
          <span className="text-gray-400 text-base cursor-pointer">☺</span>
          <span className="text-gray-400 text-base cursor-pointer">🖼</span>
        </div>
      </div>
    </div>
  );
}

// TikTok
export function TikTokPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden rounded-xl flex items-center justify-center"
      style={{ background: "#161823" }}
    >
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
      ) : (
        <div className="w-full h-full bg-black" />
      )}
      <div className="absolute right-2 bottom-6 flex flex-col items-center gap-0.5">
        <div className="relative mb-2">
          <Avatar src={platform.avatar} alt={platform.handle} size={48} border />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#FE2C55] rounded-full flex items-center justify-center text-white text-xs leading-none">
            +
          </span>
        </div>
        <button className="flex flex-col items-center" tabIndex={-1}>
          <div className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5" fill="white" stroke="white" strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-white mt-0.5">0</span>
        </button>
        <button className="flex flex-col items-center" tabIndex={-1}>
          <div className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5" fill="white" stroke="white" strokeWidth={2} />
          </div>
        </button>
        <button className="flex flex-col items-center" tabIndex={-1}>
          <div className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center">
            <Bookmark className="w-5 h-5" fill="white" stroke="white" strokeWidth={2} />
          </div>
        </button>
        <button className="flex flex-col items-center" tabIndex={-1}>
          <div className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
              <path d="M14 4v3.5C7 8.5 3 13 2 18.5l1 .5c2-3 5.5-5 11-5V18l8-7L14 4z" />
            </svg>
          </div>
        </button>
      </div>
      <div className="absolute left-3 bottom-6 right-20 text-white drop-shadow-md space-y-1.5">
        <div className="text-sm font-bold hover:underline cursor-pointer">{platform.handle}</div>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <Music className="w-4 h-4" />
          <div className="truncate">{caption || "Original Sound"}</div>
        </div>
      </div>
    </div>
  );
}

// Facebook
export function FacebookPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="w-[400px] bg-white shadow-lg max-h-screen overflow-y-auto flex flex-col rounded-xl">
      <div className="flex items-center justify-between p-4 shrink-0">
        <div className="flex items-center gap-2">
          <Avatar src={platform.avatar} alt={platform.handle} size={40} />
          <div>
            <div className="flex items-center">
              <span className="text-[15px] font-semibold text-[#050505] hover:underline cursor-pointer">
                {platform.handle}
              </span>
              <CheckCircle2 className="w-4 h-4 ml-1" style={{ color: "#0A66C2" }} fill="#0A66C2" stroke="#fff" />
            </div>
            <div className="flex items-center text-[13px] text-[#65676B]">
              <span>Draft</span>
              <span className="mx-1">·</span>
              <Globe className="w-4 h-4" />
            </div>
          </div>
        </div>
        <button className="text-[#65676B] hover:bg-gray-100 rounded-full p-2 transition-colors" tabIndex={-1}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 pb-3 flex-none">
        <div className="text-[15px] text-[#050505] whitespace-pre-wrap">{caption}</div>
      </div>
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ background: "#F0F2F5", minHeight: 200 }}
      >
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="w-full max-h-96 object-cover" />
        ) : null}
      </div>
      <div className="px-4 pt-1 pb-2 shrink-0">
        <div className="flex items-center justify-between py-2 text-[#65676B] text-[15px]">
          <div className="flex items-center">
            <div className="bg-[#0A66C2] rounded-full p-1">
              <ThumbsUp className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>0 comments</span>
            <span>·</span>
            <span>0 reposts</span>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-1">
          <div className="flex items-center justify-between">
            <button
              className="flex-1 flex items-center justify-center py-2 hover:bg-[#F0F2F5] rounded-lg transition-colors text-[#65676B] font-semibold text-[15px]"
              tabIndex={-1}
            >
              <ThumbsUp className="w-5 h-5 mr-2" /> Like
            </button>
            <button
              className="flex-1 flex items-center justify-center py-2 hover:bg-[#F0F2F5] rounded-lg transition-colors text-[#65676B] font-semibold text-[15px]"
              tabIndex={-1}
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Comment
            </button>
            <button
              className="flex-1 flex items-center justify-center py-2 hover:bg-[#F0F2F5] rounded-lg transition-colors text-[#65676B] font-semibold text-[15px]"
              tabIndex={-1}
            >
              <Share2 className="w-5 h-5 mr-2" /> Repost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// YouTube Shorts
export function YouTubePreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden rounded-xl bg-black">
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className="w-full h-full object-contain" />
      ) : null}
      <MoreHorizontal className="absolute top-2 right-2 text-white opacity-80 rotate-90" />
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6">
        <div className="relative">
          <Avatar src={platform.avatar} alt={platform.handle} size={48} border />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#FF0000] rounded-full flex items-center justify-center text-white text-xs">
            <Plus className="w-4 h-4" />
          </div>
        </div>
        <button className="flex flex-col items-center text-white drop-shadow-md" tabIndex={-1}>
          <ThumbsUp className="w-8 h-8" strokeWidth={1.5} />
          <span className="text-sm mt-1">0</span>
        </button>
        <button className="flex flex-col items-center text-white drop-shadow-md" tabIndex={-1}>
          <MessageCircle className="w-8 h-8" strokeWidth={1.5} />
          <span className="text-sm mt-1">0</span>
        </button>
        <button className="flex flex-col items-center text-white drop-shadow-md" tabIndex={-1}>
          <Share2 className="w-8 h-8" strokeWidth={1.5} />
        </button>
        <button className="flex flex-col items-center text-white drop-shadow-md" tabIndex={-1}>
          <VolumeX className="w-8 h-8" strokeWidth={1.5} />
        </button>
      </div>
      <div className="absolute left-3 bottom-3 right-3 text-white drop-shadow-md space-y-1">
        <p className="text-sm font-bold hover:underline cursor-pointer">@{platform.handle}</p>
        <div className="text-sm whitespace-pre-wrap">{caption}</div>
      </div>
    </div>
  );
}

// LinkedIn
export function LinkedInPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="w-[400px] bg-card shadow-lg flex flex-col rounded-xl py-2">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={platform.avatar} alt={platform.handle} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-sm hover:underline cursor-pointer truncate">{platform.handle}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1 truncate">
              <span>Draft</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="text-sm font-semibold text-[#0866ff] hover:opacity-80" tabIndex={-1}>
            Follow
          </button>
          <MoreHorizontal className="w-5 h-5 text-muted-foreground cursor-pointer" />
        </div>
      </div>
      <div className="px-4 pb-3 text-sm whitespace-pre-wrap">{caption}</div>
      {mediaUrl ? (
        <div className="bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="w-full max-h-80 object-cover" />
        </div>
      ) : null}
      <div className="flex items-center gap-1 px-2 pt-1 border-t border-border mx-3">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-muted-foreground hover:bg-muted/50 text-xs font-medium"
          tabIndex={-1}
        >
          <ThumbsUp className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span>Like</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-muted-foreground hover:bg-muted/50 text-xs font-medium"
          tabIndex={-1}
        >
          <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span>Comment</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-muted-foreground hover:bg-muted/50 text-xs font-medium"
          tabIndex={-1}
        >
          <Share2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}

// X / Twitter
export function TwitterPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="w-[420px] bg-black text-white shadow-none max-h-screen overflow-y-auto rounded-xl border border-zinc-800">
      <div className="flex items-start justify-between px-4 pt-3">
        <div className="flex items-start gap-3">
          <Avatar src={platform.avatar} alt={platform.handle} size={40} />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm hover:underline cursor-pointer">{platform.handle}</span>
              <VerifiedMark color="#1d9bf0" />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>@{platform.handle}</span>
              <span>·</span>
              <span>Draft</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <button className="hover:text-[#1d9bf0] transition" aria-label="Analyze" tabIndex={-1}>
            <Sparkles className="w-4 h-4" />
          </button>
          <MoreHorizontal className="w-6 h-6 cursor-pointer" />
        </div>
      </div>
      <div className="px-4 pt-2 pb-3">
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{caption || "No caption"}</p>
      </div>
      {mediaUrl ? (
        <div className="px-4 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="rounded-2xl border border-zinc-800 w-full max-h-96 object-cover" />
        </div>
      ) : null}
      <div className="flex items-center justify-between px-4 pb-3 text-gray-500">
        <div className="flex items-center justify-between flex-1 max-w-[75%]">
          <button className="flex items-center gap-1 hover:text-[#1d9bf0] transition" tabIndex={-1}>
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1 hover:text-green-500 transition" tabIndex={-1}>
            <Repeat className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1 hover:text-red-500 transition" tabIndex={-1}>
            <Heart className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1 hover:text-[#1d9bf0] transition" tabIndex={-1}>
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="hover:text-[#1d9bf0] transition" tabIndex={-1}>
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="hover:text-[#1d9bf0] transition" tabIndex={-1}>
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Threads
export function ThreadsPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div className="w-[400px] bg-black text-white shadow-lg flex flex-col rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={platform.avatar} alt={platform.handle} size={40} border />
          <div>
            <div className="font-semibold hover:underline cursor-pointer">{platform.handle}</div>
            <div className="text-xs text-gray-500">0 seconds ago</div>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500 cursor-pointer" />
      </div>
      <div className="px-4 pb-4 whitespace-pre-wrap text-sm">{caption}</div>
      {mediaUrl ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="w-full max-h-96 object-cover" />
        </div>
      ) : null}
      <div className="flex justify-around items-center py-2 border-t border-[#222]">
        <button className="text-gray-500 hover:text-white" tabIndex={-1}>
          <MessageCircle className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-white" tabIndex={-1}>
          <Repeat className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-white" tabIndex={-1}>
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Bluesky
export function BlueskyPreview({ platform, caption, mediaUrl }: PreviewProps) {
  return (
    <div
      className="w-[400px] text-white shadow-none overflow-y-auto rounded-xl border"
      style={{ background: "#15202B", borderColor: "#22303C" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={platform.avatar} alt={platform.handle} size={40} />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{platform.handle}</span>
              <CheckCircle2 className="w-4 h-4" style={{ color: "#60a5fa" }} fill="#60a5fa" stroke="#15202B" />
            </div>
            <span className="text-xs text-gray-400">
              @{platform.handle} · Draft
            </span>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
      </div>
      <p className="px-4 pb-2 text-gray-300 whitespace-pre-wrap">{caption || "No content"}</p>
      {mediaUrl ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="w-full max-h-96 object-cover" />
        </div>
      ) : null}
      <div className="flex items-center gap-6 px-4 py-2 text-gray-400">
        <button className="flex items-center gap-1 hover:text-blue-400" tabIndex={-1}>
          <MessageCircle className="w-5 h-5" />
          <span>0</span>
        </button>
        <button className="flex items-center gap-1 hover:text-green-400" tabIndex={-1}>
          <Repeat className="w-5 h-5" />
          <span>0</span>
        </button>
        <button className="flex items-center gap-1 hover:text-red-400" tabIndex={-1}>
          <Heart className="w-5 h-5" />
          <span>0</span>
        </button>
        <button className="flex items-center hover:text-blue-400" tabIndex={-1}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function PlatformPreviewRouter(props: PreviewProps) {
  switch (props.platform.id) {
    case "instagram":
      return <InstagramPreview {...props} />;
    case "pinterest":
      return <PinterestPreview {...props} />;
    case "tiktok":
      return <TikTokPreview {...props} />;
    case "facebook":
      return <FacebookPreview {...props} />;
    case "youtube":
      return <YouTubePreview {...props} />;
    case "linkedin":
      return <LinkedInPreview {...props} />;
    case "twitter":
      return <TwitterPreview {...props} />;
    case "threads":
      return <ThreadsPreview {...props} />;
    case "bluesky":
      return <BlueskyPreview {...props} />;
    default:
      return null;
  }
}
