"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Smile,
  Bookmark,
  Sparkles,
  Tag,
  Plus,
  AtSign,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformMeta } from "@/lib/platforms";
import { CommunitySelector } from "@/components/dashboard/community-selector";
import { QuoteTweetInput } from "@/components/dashboard/quote-tweet-input";
import { AdvancedOptionsPanel } from "@/components/dashboard/advanced-options-panel";
import type { PlatformAdvancedOptions } from "@/lib/publishing/advanced-options";
import type { MediaKind } from "@/lib/publishing/capability-matrix";

interface AccountPreviewCardProps {
  platform: PlatformMeta;
  value: string;
  onChange: (v: string) => void;
  firstComment?: string;
  onFirstCommentChange?: (v: string) => void;
  hasVideo?: boolean;
  community?: string;
  onCommunityChange?: (v: string) => void;
  quoteTweet?: string;
  onQuoteTweetChange?: (v: string) => void;
  advancedOptions?: PlatformAdvancedOptions;
  onAdvancedOptionsChange?: (next: PlatformAdvancedOptions) => void;
  mediaKind?: MediaKind;
}

// Per-account caption card shown inside the Captions card.
// Matches original: 7 common action buttons (Bold/Italic/Underline/Emoji/Saved/AI/Hashtag)
// plus platform-specific extras (Comment, Mention, Location, Trial Reels for IG when video).
// Also renders platform-specific auxiliary inputs (community for IG, quote tweet for X)
// and the per-platform advanced options panel (Feature 1).
export function AccountPreviewCard({
  platform,
  value,
  onChange,
  firstComment,
  onFirstCommentChange,
  hasVideo,
  community,
  onCommunityChange,
  quoteTweet,
  onQuoteTweetChange,
  advancedOptions,
  onAdvancedOptionsChange,
  mediaKind,
}: AccountPreviewCardProps) {
  const [focused, setFocused] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(() => !!firstComment);
  const counter = `${value.length}/${platform.charLimit}`;
  const pct = Math.min(100, (value.length / platform.charLimit) * 100);
  const hasText = value.trim().length > 0;

  const showComment = ["instagram", "twitter", "linkedin", "threads", "facebook", "tiktok", "pinterest"].includes(
    platform.id
  );
  const showMention = ["linkedin", "facebook", "instagram", "twitter", "tiktok"].includes(platform.id);
  const showLocation = ["instagram", "facebook", "tiktok", "linkedin"].includes(platform.id);

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden flex flex-col", platform.borderClass)}>
      <div className="px-3 py-2 border-b flex items-center justify-between gap-2 bg-zinc-50/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-sm flex-shrink-0", platform.textClass)}>{platform.icon}</span>
          <p className="text-xs font-medium truncate">{platform.handle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium text-zinc-500">{counter}</span>
          <div className="w-12 h-0.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", pct > 90 ? "bg-red-500" : "bg-zinc-950")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Write your caption for ${platform.name}...`}
          className="w-full min-h-[180px] resize-none bg-transparent text-base border-0 focus:outline-none p-3 pb-12 placeholder:text-zinc-400 overflow-y-auto"
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-center gap-0.5 px-2 py-1.5 transition-opacity",
            focused ? "opacity-100" : "opacity-60 hover:opacity-100"
          )}
        >
          <ActionButton icon={<Bold className="size-3.5" />} title="Bold" disabled={!hasText} />
          <ActionButton
            icon={<Italic className="size-3.5" />}
            title="Italic"
            disabled={!hasText}
          />
          <ActionButton
            icon={<Underline className="size-3.5" />}
            title="Underline"
            disabled={!hasText}
          />
          <ActionButton icon={<Smile className="size-3.5" />} title="Emoji" />
          <ActionButton icon={<Bookmark className="size-3.5" />} title="Saved captions" label="Saved" />
          <ActionButton
            icon={<Sparkles className="size-3.5" />}
            title="AI suggestions"
            disabled={!hasText}
          />
          <ActionButton icon={<Tag className="size-3.5" />} title="Hashtag" />
          {showComment ? (
            <button
              type="button"
              onClick={() => setShowCommentInput((prev) => !prev)}
              title="First comment"
              className={cn(
                "inline-flex items-center gap-1 size-7 justify-center rounded-md transition-colors hover:bg-zinc-100 text-zinc-600 px-2 w-auto",
                showCommentInput && "bg-zinc-100 text-zinc-950 font-semibold"
              )}
            >
              <Plus className="size-3.5" />
              <span>{platform.id === "threads" ? "Thread / Comment" : "Comment"}</span>
            </button>
          ) : null}
          {showMention ? (
            <ActionButton
              icon={<AtSign className="size-3.5" />}
              title="Mention"
              label="Mention"
            />
          ) : null}
          {showLocation ? (
            <ActionButton
              icon={<MapPin className="size-3.5" />}
              title="Location"
              label="Location"
            />
          ) : null}
          {platform.id === "instagram" && hasVideo ? (
            <button
              type="button"
              className="ml-auto inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 h-7 text-xs font-medium hover:bg-zinc-50"
            >
              Trial Reels
            </button>
          ) : null}
        </div>
      </div>

      {/* Platform-specific auxiliary inputs (rendered at bottom of card) */}
      {platform.id === "instagram" && onCommunityChange ? (
        <div className="px-3 py-3 border-t bg-zinc-50/30 flex-shrink-0">
          <CommunitySelector value={community} onChange={onCommunityChange} />
        </div>
      ) : null}
      {platform.id === "twitter" && onQuoteTweetChange ? (
        <div className="px-3 py-3 border-t bg-zinc-50/30 flex-shrink-0">
          <QuoteTweetInput value={quoteTweet ?? ""} onChange={onQuoteTweetChange} />
        </div>
      ) : null}
      {showCommentInput && onFirstCommentChange ? (
        <div className="px-3 py-3 border-t bg-zinc-50/30 flex-shrink-0 space-y-1">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
            First Comment
          </label>
          <textarea
            value={firstComment ?? ""}
            onChange={(e) => onFirstCommentChange(e.target.value)}
            placeholder="Write the first comment to auto-post..."
            className="w-full min-h-[60px] max-h-[120px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950/30 transition-colors resize-y font-normal text-zinc-800"
          />
        </div>
      ) : null}
      {onAdvancedOptionsChange && advancedOptions && mediaKind ? (
        <div className="px-3 py-3 border-t bg-zinc-50/30 flex-shrink-0">
          <AdvancedOptionsPanel
            platform={platform.id}
            platformName={platform.name}
            mediaKind={mediaKind}
            value={advancedOptions}
            onChange={onAdvancedOptionsChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  title,
  disabled,
}: {
  icon: React.ReactNode;
  label?: string;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 size-7 justify-center rounded-md transition-colors",
        "hover:bg-zinc-100 text-zinc-600",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
        label && "size-auto px-2 w-auto"
      )}
    >
      {icon}
      {label ? <span className="text-xs font-medium">{label}</span> : null}
    </button>
  );
}
