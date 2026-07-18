"use client";

import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Plus,
  Link2,
  Mail,
  Music2,
  Eye,
  MousePointerClick,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform } from "@/lib/platforms";
import { Bio, BioLink, SocialLink, SocialPlatform, newLinkId, newSocialId, StyleOption } from "@/lib/link-in-bio/store";
import { THEMES, Theme, getTheme } from "@/lib/link-in-bio/themes";
import { cn } from "@/lib/utils";

// ============================================================================
// PAGE SETTINGS
// ============================================================================

type PageSettingsProps = {
  bio: Bio;
  onChange: (patch: Partial<Bio>) => void;
};

export function PageSettingsSection({ bio, onChange }: PageSettingsProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Page Settings</h2>
      <p className="text-xs text-zinc-500 mt-1">
        Configure your bio page URL and profile information
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-700">Display Name</label>
          <input
            type="text"
            value={bio.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            placeholder="Your name or brand name"
            maxLength={50}
            className="mt-1 w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700">Bio</label>
          <textarea
            value={bio.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            placeholder="A short description about you or your brand"
            maxLength={150}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none"
          />
          <p className="mt-1 text-[10px] text-zinc-400 text-right">
            {bio.bio.length}/150
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LINKS EDITOR (with drag-to-reorder)
// ============================================================================

type LinksEditorProps = {
  bio: Bio;
  onChange: (patch: Partial<Bio>) => void;
};

function updateLink(bio: Bio, linkId: string, patch: Partial<BioLink>): Bio {
  return {
    ...bio,
    links: bio.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
  };
}

function deleteLink(bio: Bio, linkId: string): Bio {
  return { ...bio, links: bio.links.filter((l) => l.id !== linkId) };
}

function addLink(bio: Bio): Bio {
  const link: BioLink = {
    id: newLinkId(),
    title: "",
    url: "",
    enabled: true,
    clicks: 0,
  };
  return { ...bio, links: [...bio.links, link] };
}

export function LinksEditorSection({ bio, onChange }: LinksEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const reorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const next = [...bio.links];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange({ links: next });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Links</h2>
      <p className="text-xs text-zinc-500 mt-1">
        Add and reorder your links. Drag to reorder.
      </p>
      <div className="mt-4 space-y-2">
        {bio.links.length === 0 ? null : (
          bio.links.map((link, idx) => {
            const isDragging = draggingId === link.id;
            const isOver = dragOverIdx === idx && draggingId !== link.id;
            return (
              <div
                key={link.id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(link.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(idx));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingId && draggingId !== link.id) setDragOverIdx(idx);
                }}
                onDragLeave={() => {
                  if (dragOverIdx === idx) setDragOverIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                  if (!isNaN(fromIdx)) reorder(fromIdx, idx);
                  setDraggingId(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverIdx(null);
                }}
                className={cn(
                  "rounded-lg border bg-white p-3 transition-all",
                  isDragging && "opacity-50",
                  isOver ? "border-zinc-900 border-dashed" : "border-zinc-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className="size-5 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="size-4" />
                  </button>
                  <span className="flex-1 text-sm font-medium truncate">
                    {link.title || "Untitled Link"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={link.enabled}
                    onClick={() =>
                      onChange({ links: updateLink(bio, link.id, { enabled: !link.enabled }).links })
                    }
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      link.enabled ? "bg-zinc-900" : "bg-zinc-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                        link.enabled ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ links: deleteLink(bio, link.id).links })}
                    aria-label="Delete link"
                    className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) =>
                      onChange({ links: updateLink(bio, link.id, { title: e.target.value }).links })
                    }
                    placeholder="Link title"
                    className="h-9 px-3 rounded-md border border-zinc-200 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      onChange({ links: updateLink(bio, link.id, { url: e.target.value }).links })
                    }
                    placeholder="https://example.com"
                    className="h-9 px-3 rounded-md border border-zinc-200 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  />
                </div>
              </div>
            );
          })
        )}
        <button
          type="button"
          onClick={() => onChange({ links: addLink(bio).links })}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium py-2.5 text-zinc-700"
        >
          <Plus className="size-4" />
          Add Link
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SOCIAL LINKS EDITOR
// ============================================================================

const SOCIAL_OPTIONS: { id: SocialPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "github", label: "GitHub" },
  { id: "email", label: "Email" },
];

type SocialLinksEditorProps = {
  bio: Bio;
  onChange: (patch: Partial<Bio>) => void;
};

function updateSocial(bio: Bio, id: string, patch: Partial<SocialLink>): Bio {
  return {
    ...bio,
    socialLinks: bio.socialLinks.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

function deleteSocial(bio: Bio, id: string): Bio {
  return { ...bio, socialLinks: bio.socialLinks.filter((s) => s.id !== id) };
}

function addSocial(bio: Bio, platform: SocialPlatform): Bio {
  return {
    ...bio,
    socialLinks: [...bio.socialLinks, { id: newSocialId(), platform, url: "" }],
  };
}

export function SocialLinksEditorSection({ bio, onChange }: SocialLinksEditorProps) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Social Links</h2>
      <p className="text-xs text-zinc-500 mt-1">
        Add your social media profiles to show icons on your page
      </p>
      <div className="mt-4 space-y-2">
        {bio.socialLinks.map((s) => {
          const opt = SOCIAL_OPTIONS.find((o) => o.id === s.platform);
          const plat = getPlatform(s.platform);
          return (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2"
            >
              {plat ? (
                <PlatformAvatar platform={plat} size={28} rounded="sm" />
              ) : (
                <div className="size-7 rounded-md bg-zinc-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-500">
                  {opt?.label?.[0] ?? "?"}
                </div>
              )}
              <span className="text-xs font-medium w-20 shrink-0">{opt?.label ?? s.platform}</span>
              <input
                type="text"
                value={s.url}
                onChange={(e) =>
                  onChange({ socialLinks: updateSocial(bio, s.id, { url: e.target.value }).socialLinks })
                }
                placeholder={
                  s.platform === "email"
                    ? "you@example.com"
                    : `${s.platform}.com/username`
                }
                className="flex-1 h-8 px-2 rounded-md border border-zinc-200 text-xs outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={() => onChange({ socialLinks: deleteSocial(bio, s.id).socialLinks })}
                aria-label="Delete"
                className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
        {adding ? (
          <div className="grid grid-cols-4 gap-2">
            {SOCIAL_OPTIONS.map((o) => {
              const plat = getPlatform(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange({ socialLinks: addSocial(bio, o.id).socialLinks });
                    setAdding(false);
                  }}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 py-2.5"
                >
                  {plat ? (
                    <PlatformAvatar platform={plat} size={28} rounded="sm" />
                  ) : (
                    <div className="size-7 rounded-md bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      {o.label[0]}
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-600">{o.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium px-3 py-2 text-zinc-700"
          >
            <Plus className="size-3" />
            Add Social Link
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// THEME PICKER + CUSTOMIZE COLORS
// ============================================================================

const STYLE_OPTIONS: { id: StyleOption; label: string }[] = [
  { id: "rounded", label: "Rounded" },
  { id: "square", label: "Square" },
  { id: "pill", label: "Pill" },
];

type ThemePickerProps = {
  bio: Bio;
  onChange: (patch: Partial<Bio>) => void;
};

export function ThemePickerSection({ bio, onChange }: ThemePickerProps) {
  const [showCustomize, setShowCustomize] = useState(bio.customColors !== null);
  const currentTheme = getTheme(bio.themeId);

  const applyTheme = (theme: Theme) => {
    onChange({ themeId: theme.id, customColors: null });
    setShowCustomize(false);
  };

  const setCustomColor = (key: "background" | "text" | "button" | "buttonText", value: string) => {
    const next = bio.customColors ?? {
      background: currentTheme.colors.background,
      text: currentTheme.colors.text,
      button: currentTheme.colors.button,
      buttonText: currentTheme.colors.buttonText,
    };
    onChange({ customColors: { ...next, [key]: value } });
  };

  const resetCustom = () => {
    onChange({ customColors: null });
    setShowCustomize(false);
  };

  const colors = bio.customColors ?? currentTheme.colors;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Theme</h2>
      <p className="text-xs text-zinc-500 mt-1">
        Choose a theme and optionally customize colors
      </p>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {THEMES.map((t) => {
          const isSelected = bio.themeId === t.id && bio.customColors === null;
          return (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={() => applyTheme(t)}
              className={cn(
                "relative size-8 rounded-full border-2 transition-all hover:scale-110",
                isSelected ? "border-zinc-900 ring-2 ring-zinc-900/20" : "border-transparent"
              )}
              style={{ backgroundColor: t.swatch }}
              aria-label={t.label}
              aria-pressed={isSelected}
            />
          );
        })}

        <select
          value={bio.style}
          onChange={(e) => onChange({ style: e.target.value as StyleOption })}
          className="ml-2 h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs outline-none focus:border-zinc-400"
        >
          {STYLE_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowCustomize(!showCustomize)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
      >
        <span className="inline-block w-3 h-3 rounded-sm border border-zinc-300" />
        Customize colors
      </button>

      {showCustomize && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ColorField
            label="Background"
            value={colors.background}
            onChange={(v) => setCustomColor("background", v)}
          />
          <ColorField
            label="Text"
            value={colors.text}
            onChange={(v) => setCustomColor("text", v)}
          />
          <ColorField
            label="Button"
            value={colors.button}
            onChange={(v) => setCustomColor("button", v)}
          />
          <ColorField
            label="Button Text"
            value={colors.buttonText}
            onChange={(v) => setCustomColor("buttonText", v)}
          />
          <button
            type="button"
            onClick={resetCustom}
            className="col-span-2 inline-flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 py-1"
          >
            <RotateCcw className="size-3" />
            Reset to theme defaults
          </button>
        </div>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-5 rounded cursor-pointer bg-transparent border-0 p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono outline-none bg-transparent"
        />
      </div>
    </label>
  );
}

// ============================================================================
// ANALYTICS SECTION
// ============================================================================

type AnalyticsProps = {
  username: string;
  totalViews: number;
  totalClicks: number;
  perLinkClicks: Record<string, number>;
  linkTitles: Record<string, string>;
  range: "7d" | "14d" | "30d" | "90d";
  onRangeChange: (r: "7d" | "14d" | "30d" | "90d") => void;
};

const RANGES: AnalyticsProps["range"][] = ["7d", "14d", "30d", "90d"];

export function AnalyticsSection({
  username,
  totalViews,
  totalClicks,
  perLinkClicks,
  linkTitles,
  range,
  onRangeChange,
}: AnalyticsProps) {
  const hasData = totalViews > 0 || totalClicks > 0;
  const topLinks = Object.entries(perLinkClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Analytics</h2>
      <p className="text-xs text-zinc-500 mt-1">Track page views and link clicks</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Eye className="size-3.5 text-blue-500" />
            Page Views
          </div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{totalViews.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MousePointerClick className="size-3.5 text-emerald-500" />
            Link Clicks
          </div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{totalClicks.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={cn(
              "h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
              range === r
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 min-h-[160px]">
        {hasData ? (
          <div className="space-y-2">
            {topLinks.map(([linkId, count]) => (
              <div key={linkId} className="flex items-center justify-between text-xs">
                <span className="truncate">{linkTitles[linkId] || "Untitled"}</span>
                <span className="font-medium">{count.toLocaleString()}</span>
              </div>
            ))}
            <p className="text-[10px] text-zinc-400 mt-3">
              Last {range} — Share your bio link to track performance.
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 text-center py-8">
            No data yet. Share your bio link to start tracking!
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HEADER BAR — published URL + Save
// ============================================================================

type HeaderBarProps = {
  username: string;
  isDirty: boolean;
  onSave: () => void;
};

export function BioHeaderBar({ username, isDirty, onSave }: HeaderBarProps) {
  const [copied, setCopied] = useState(false);
  const url = `postplanify.com/@${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = `https://${url}`;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <a
        href={`/@${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
      >
        {url}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy URL"
        className="size-7 inline-flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
      <button
        type="button"
        onClick={onSave}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 h-9 text-sm font-semibold transition-colors",
          isDirty
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : "bg-zinc-200 text-zinc-500 cursor-default"
        )}
        disabled={!isDirty}
      >
        Save Changes
      </button>
    </div>
  );
}