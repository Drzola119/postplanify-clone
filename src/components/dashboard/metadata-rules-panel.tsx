"use client";

import { useState, useMemo, useCallback } from "react";
import { Hash, ChevronDown, ChevronUp, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetadataMergeMode = "append" | "prioritize" | "replace_hashtags";

export interface MetadataRules {
  enabled: boolean;
  hashtags: string[];
  ctaLine: string;
  mode: MetadataMergeMode;
  startDate: string;
  endDate: string;
}

const MERGE_MODES: { value: MetadataMergeMode; label: string; desc: string }[] = [
  { value: "append", label: "Append", desc: "Manual hashtags after AI hashtags" },
  { value: "prioritize", label: "Prioritize", desc: "Manual hashtags before AI hashtags" },
  { value: "replace_hashtags", label: "Replace", desc: "Only manual hashtags, AI caption stays" },
];

const PLATFORM_LIMITS: Record<string, { chars: number; hashtags: number }> = {
  instagram: { chars: 2200, hashtags: 30 },
  tiktok: { chars: 2200, hashtags: 100 },
  twitter: { chars: 280, hashtags: 30 },
  linkedin: { chars: 3000, hashtags: 30 },
  facebook: { chars: 63206, hashtags: 30 },
  pinterest: { chars: 500, hashtags: 20 },
};

interface MetadataRulesPanelProps {
  rules: MetadataRules;
  onChange: (rules: MetadataRules) => void;
  sampleCaption?: string;
}

export function MetadataRulesPanel({
  rules,
  onChange,
  sampleCaption = "Your AI-generated caption will appear here with rules applied.",
}: MetadataRulesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [hashtagsText, setHashtagsText] = useState(rules.hashtags.join("\n"));

  const parsedHashtags = useMemo(() => {
    return hashtagsText
      .split(/[\n,]+/)
      .map((h) => h.trim())
      .filter(Boolean);
  }, [hashtagsText]);

  const update = useCallback(
    (partial: Partial<MetadataRules>) => {
      onChange({ ...rules, ...partial });
    },
    [rules, onChange]
  );

  const handleHashtagsChange = (text: string) => {
    setHashtagsText(text);
    const tags = text
      .split(/[\n,]+/)
      .map((h) => h.trim())
      .filter(Boolean);
    update({ hashtags: tags });
  };

  // Live preview of merged output
  const previewText = useMemo(() => {
    if (!rules.enabled) return sampleCaption;
    const hashtagStr = parsedHashtags.join(" ");
    const parts: string[] = [sampleCaption];
    if (rules.ctaLine) parts.push(rules.ctaLine);
    if (hashtagStr) parts.push(hashtagStr);
    return parts.join("\n\n");
  }, [rules.enabled, rules.ctaLine, parsedHashtags, sampleCaption]);

  // Hashtag count warnings
  const warnings = useMemo(() => {
    const warns: string[] = [];
    if (parsedHashtags.length > 30) {
      warns.push("⚠️ Exceeds Instagram / Pinterest 30-hashtag limit");
    }
    if (parsedHashtags.length > 20) {
      warns.push("⚠️ Exceeds Pinterest 20-hashtag limit");
    }
    return warns;
  }, [parsedHashtags]);

  const hasActiveRules = rules.enabled && (rules.hashtags.length > 0 || rules.ctaLine);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200",
        rules.enabled ? "border-zinc-300" : "border-zinc-200"
      )}
    >
      {/* Toggle header button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-7 rounded-lg flex items-center justify-center transition-colors",
              hasActiveRules ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-500"
            )}
          >
            <Hash className="size-3.5" />
          </div>
          <span className="text-sm font-semibold text-zinc-800">Campaign Rules</span>
          {hasActiveRules && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="size-4 text-zinc-400" />
          ) : (
            <ChevronDown className="size-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      <div
        className={cn(
          "transition-all duration-280 ease-out overflow-hidden",
          expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="border-t border-zinc-100 px-4 py-4 space-y-5">
          {/* Master enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Enable Campaign Rules</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically apply hashtags and CTA to every post
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rules.enabled}
              onClick={() => update({ enabled: !rules.enabled })}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                rules.enabled ? "bg-zinc-950" : "bg-zinc-200"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 transform rounded-full bg-white transition-transform shadow-sm",
                  rules.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {rules.enabled && (
            <>
              {/* Merge Mode */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Merge Mode
                </p>
                <div className="flex gap-2 flex-wrap">
                  {MERGE_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => update({ mode: m.value })}
                      className={cn(
                        "px-3 h-8 rounded-lg text-xs font-medium border transition-colors",
                        rules.mode === m.value
                          ? "bg-zinc-950 text-white border-zinc-950"
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-400">
                  {MERGE_MODES.find((m) => m.value === rules.mode)?.desc}
                </p>
              </div>

              {/* Active window */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Active Window{" "}
                  <span className="normal-case font-normal text-zinc-400">(optional)</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">From</span>
                    <input
                      type="date"
                      value={rules.startDate}
                      onChange={(e) => update({ startDate: e.target.value })}
                      className="rounded-lg border border-zinc-200 bg-white px-2 h-8 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                    />
                  </div>
                  <span className="text-zinc-400">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">To</span>
                    <input
                      type="date"
                      value={rules.endDate}
                      onChange={(e) => update({ endDate: e.target.value })}
                      className="rounded-lg border border-zinc-200 bg-white px-2 h-8 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                    />
                  </div>
                  {(rules.startDate || rules.endDate) && (
                    <button
                      type="button"
                      onClick={() => update({ startDate: "", endDate: "" })}
                      className="size-7 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Campaign hashtags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Campaign Hashtags
                  </p>
                  <span className="text-xs text-zinc-400">
                    {parsedHashtags.length} hashtag{parsedHashtags.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <textarea
                  value={hashtagsText}
                  onChange={(e) => handleHashtagsChange(e.target.value)}
                  placeholder={"#marketing\n#branding\n#summer2025"}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950/30 transition-colors font-mono"
                />
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">
                    {w}
                  </p>
                ))}
              </div>

              {/* CTA / Brand line */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  CTA / Brand Line{" "}
                  <span className="normal-case font-normal text-zinc-400">(optional)</span>
                </p>
                <input
                  type="text"
                  value={rules.ctaLine}
                  onChange={(e) => update({ ctaLine: e.target.value })}
                  placeholder="👉 Follow @trustiify for more!"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950/30 transition-colors"
                />
              </div>

              {/* Live preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Live Preview
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
                  <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap font-mono">
                    {previewText}
                  </p>
                  <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200">
                    {previewText.length} chars · {parsedHashtags.length} hashtags
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
