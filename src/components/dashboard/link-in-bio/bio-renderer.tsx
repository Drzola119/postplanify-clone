"use client";

import { useMemo } from "react";
import { Mail, Music2, ExternalLink, Eye } from "lucide-react";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform, type PlatformMeta } from "@/lib/platforms";
import { Bio, SocialLink } from "@/lib/link-in-bio/store";
import { getTheme, Theme } from "@/lib/link-in-bio/themes";
import { cn } from "@/lib/utils";

type Props = {
  bio: Bio;
  /** When true, links are clickable (public page); when false, just preview */
  interactive?: boolean;
  /** Hide owner-only controls (currently a no-op since public page is read-only) */
  showOwnerControls?: boolean;
  /** Compact mode for preview thumbnail */
  compact?: boolean;
  /** Optional click count for non-interactive preview */
  showClickCounts?: boolean;
  className?: string;
};

const SOCIAL_ICONS: Record<string, PlatformMeta | undefined> = {
  instagram: getPlatform("instagram"),
  twitter: getPlatform("twitter"),
  tiktok: getPlatform("tiktok"),
  youtube: getPlatform("youtube"),
  linkedin: getPlatform("linkedin"),
  facebook: getPlatform("facebook"),
  github: undefined,
  email: undefined,
};

function getInitial(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

function styleRadius(style: Bio["style"]): string {
  switch (style) {
    case "square":
      return "rounded-md";
    case "pill":
      return "rounded-full";
    case "rounded":
    default:
      return "rounded-xl";
  }
}

export function BioRenderer({
  bio,
  interactive = false,
  showOwnerControls = false,
  compact = false,
  showClickCounts = false,
  className,
}: Props) {
  const theme: Theme = useMemo(() => getTheme(bio.themeId), [bio.themeId]);
  const useCustom = bio.customColors !== null;
  const baseColors = useCustom ? (bio.customColors as { background: string; text: string; button: string; buttonText: string }) : theme.colors;
  const avatarBg = useCustom ? baseColors.button : theme.colors.avatarBg;
  const avatarText = useCustom ? baseColors.buttonText : theme.colors.avatarText;
  const colors = baseColors;

  const visibleLinks = bio.links.filter((l) => l.enabled);
  const visibleSocials = bio.socialLinks.filter((s) => s.url.trim().length > 0);

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full",
        compact ? "px-4 py-6" : "px-6 py-10 sm:py-16",
        className
      )}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex items-center justify-center font-bold shrink-0",
          compact ? "size-14 text-xl" : "size-20 sm:size-24 text-3xl"
        )}
        style={{
          backgroundColor: avatarBg,
          color: avatarText,
          borderRadius: "9999px",
        }}
        aria-hidden
      >
        {getInitial(bio.displayName || bio.username)}
      </div>

      {/* Name */}
      <h1
        className={cn(
          "mt-4 text-center font-bold",
          compact ? "text-base" : "text-xl sm:text-2xl"
        )}
      >
        {bio.displayName || bio.username}
      </h1>

      {/* Bio */}
      {bio.bio && !compact && (
        <p className="mt-2 text-center max-w-md text-sm opacity-80">{bio.bio}</p>
      )}

      {/* Social icons row */}
      {visibleSocials.length > 0 && !compact && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {visibleSocials.map((s) => {
            const platform = SOCIAL_ICONS[s.platform];
            const href =
              s.platform === "email"
                ? `mailto:${s.url}`
                : s.url.startsWith("http")
                  ? s.url
                  : `https://${s.url}`;
            return (
              <a
                key={s.id}
                href={interactive ? href : undefined}
                target={interactive ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label={s.platform}
                className="opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: colors.text }}
              >
                {platform ? (
                  <PlatformAvatar platform={platform} size={20} rounded="full" />
                ) : (
                  <Mail className="size-5" />
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* Links list */}
      <div className={cn("mt-6 w-full space-y-3", compact ? "max-w-[260px]" : "max-w-md")}>
        {visibleLinks.length === 0 ? (
          <p
            className={cn(
              "text-center text-sm opacity-50",
              compact && "py-8"
            )}
          >
            Add links to see them here
          </p>
        ) : (
          visibleLinks.map((l) => {
            const radius = styleRadius(bio.style);
            const hasUrl = l.url.trim().length > 0;
            const Wrapper = interactive && hasUrl ? "a" : "div";
            const wrapperProps =
              interactive && hasUrl
                ? {
                    href: l.url.startsWith("http") ? l.url : `https://${l.url}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {};
            return (
              <Wrapper
                key={l.id}
                {...(wrapperProps as Record<string, string>)}
                data-link-id={interactive ? l.id : undefined}
                className={cn(
                  "group flex items-center gap-3 w-full text-left transition-transform",
                  compact ? "px-3 py-2.5" : "px-4 py-3",
                  radius,
                  interactive && hasUrl && "hover:scale-[1.01] cursor-pointer"
                )}
                style={{
                  backgroundColor: colors.button,
                  color: colors.buttonText,
                }}
              >
                <span className={cn("font-semibold flex-1 truncate", compact && "text-sm")}>
                  {l.title || "Untitled Link"}
                </span>
                {showClickCounts && l.clicks > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-80">
                    <Eye className="size-3" />
                    {l.clicks.toLocaleString()}
                  </span>
                )}
                {interactive && hasUrl && (
                  <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100" />
                )}
              </Wrapper>
            );
          })
        )}
      </div>

      {/* Owner footer hint */}
      {showOwnerControls && (
        <div className="mt-8 flex items-center gap-2">
          <a
            href={`/dashboard/link-in-bio`}
            className="text-xs opacity-70 hover:opacity-100 underline"
            style={{ color: colors.text }}
          >
            Edit profile
          </a>
        </div>
      )}
    </div>
  );
}