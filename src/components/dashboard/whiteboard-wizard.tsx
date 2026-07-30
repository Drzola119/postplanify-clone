"use client";

/**
 * whiteboard-wizard.tsx
 *
 * Multi-step wizard for the Whiteboard Explainer Video workflow.
 * Visual + structural mirror of cartoon-video-wizard.tsx: two-column layout
 * with numbered Panels on the left and a sticky live preview on the right.
 *
 * Steps (left column, all visible at once):
 *   1. Topic & Style  — topic, mood pills, language dropdown
 *   2. Format         — duration (30s/60s), aspect ratio (9:16/16:9/1:1), CTA
 *   3. Model          — provider card grid with live clip-count preview
 *   4. Script Preview — generated phases + confirm to start render
 *
 * Right column (sticky): empty → 6-stage progress indicator → final video player.
 *
 * State is held entirely client-side; the wizard polls /api/videos/[jobId]
 * every 5s while a job is active.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Check,
  RefreshCw,
  Wand2,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  Info,
  Sparkles,
  Zap,
  Crown,
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, Field, Meta } from "@/components/dashboard/wizard-kit";
import type { VideoProviderId } from "@/lib/video-gen/types";
import {
  resolveProvider,
  resolveClipSpec,
  type ClipSpec,
} from "@/lib/video-gen/whiteboard/clip-matrix";

type Mood = "professional" | "energetic" | "funny" | "aggressive" | "calm" | "inspiring";
type Language = "en" | "fr" | "es" | "ar" | "pt" | "de";
type DurationSec = 30 | 60;
type AspectRatio = "9:16" | "16:9" | "1:1";

const MOODS: { id: Mood; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "energetic", label: "Energetic" },
  { id: "funny", label: "Funny" },
  { id: "aggressive", label: "Aggressive" },
  { id: "calm", label: "Calm" },
  { id: "inspiring", label: "Inspiring" },
];

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "en", label: "English" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
  { id: "ar", label: "Arabic" },
  { id: "pt", label: "Portuguese" },
  { id: "de", label: "German" },
];

const DURATIONS: { label: string; value: DurationSec }[] = [
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
];

const ASPECT_RATIOS: { label: string; value: AspectRatio; icon: string }[] = [
  { label: "9:16", value: "9:16", icon: "📱" },
  { label: "16:9", value: "16:9", icon: "🖥️" },
  { label: "1:1", value: "1:1", icon: "□" },
];

const PROVIDER_CARDS: Array<{
  id: VideoProviderId | "auto";
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeCls: string;
  estCostPer30s: string;
}> = [
  {
    id: "seedance-2-fast",
    label: "Seedance 2 Fast",
    blurb: "Fastest & cheapest. Great for high-volume social.",
    icon: Zap,
    badge: "⚡ Fastest",
    badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
    estCostPer30s: "~$0.03",
  },
  {
    id: "seedance-2",
    label: "Seedance 2 Standard",
    blurb: "Balanced speed and quality for explainer content.",
    icon: Cpu,
    badge: "Balanced",
    badgeCls: "bg-zinc-100 text-zinc-700 border-zinc-200",
    estCostPer30s: "~$0.04",
  },
  {
    id: "gemini-omni-flash",
    label: "Gemini Omni Flash",
    blurb: "Native audio + clean 2D whiteboard animation.",
    icon: Sparkles,
    badge: "💎 Good value",
    badgeCls: "bg-violet-50 text-violet-700 border-violet-200",
    estCostPer30s: "~$0.02",
  },
  {
    id: "veo-3.1-lite",
    label: "Veo 3.1 Lite",
    blurb: "Cinematic whiteboard at mid-tier cost.",
    icon: Sparkles,
    badge: "Cinema lite",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200",
    estCostPer30s: "~$0.05",
  },
  {
    id: "veo-3.1",
    label: "Veo 3.1",
    blurb: "Premium cinematic quality for hero explainers.",
    icon: Crown,
    badge: "🏆 Top quality",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
    estCostPer30s: "~$0.15",
  },
  {
    id: "auto",
    label: "Auto",
    blurb: "We pick the fastest path for your settings.",
    icon: Wand2,
    badge: "Smart pick",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    estCostPer30s: "—",
  },
];

interface ScriptPhasePreview {
  index: number;
  label: string;
  voiceover: string;
  onScreenText: string;
  durationSec: number;
}

interface ScriptPreview {
  topic: string;
  totalSec: number;
  clipCount: number;
  clipDurationSec: number;
  phases: ScriptPhasePreview[];
}

type JobStatus =
  | "queued"
  | "scripting"
  | "generating_clips"
  | "waiting_compose"
  | "composing"
  | "complete"
  | "failed";

interface FinalAsset {
  aspectRatio: string;
  assetId: string;
  assetUrl: string;
}

interface PollResponse {
  jobId: string;
  status: JobStatus;
  provider?: string;
  totalCostUsd?: number;
  finalAssets?: FinalAsset[];
  error?: string | null;
}

interface WhiteboardWizardProps {
  title: string;
  subtitle: string;
}

export function WhiteboardWizard({ title, subtitle }: WhiteboardWizardProps) {
  const t = useTranslations("videos");
  const tw = useTranslations("videos.wizard");

  // Form state
  const [topic, setTopic] = useState("");
  const [mood, setMood] = useState<Mood>("professional");
  const [language, setLanguage] = useState<Language>("en");
  const [durationSec, setDurationSec] = useState<DurationSec>(30);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [cta, setCta] = useState("");
  const [qualityPreference, setQualityPreference] = useState<"budget" | "quality">("budget");
  const [providerChoice, setProviderChoice] = useState<VideoProviderId | "auto">("auto");

  // Job state
  const [scriptPreview, setScriptPreview] = useState<ScriptPreview | null>(null);
  const [clipSpecPreview, setClipSpecPreview] = useState<ClipSpec | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [finalAssets, setFinalAssets] = useState<FinalAsset[]>([]);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSubmittingRender, setIsSubmittingRender] = useState(false);

  // Live clip-count preview for the chosen provider × duration.
  const livePreview: ClipSpec = (() => {
    const resolved = resolveProvider(providerChoice, qualityPreference);
    return resolveClipSpec(resolved, durationSec);
  })();

  const canGenerateScript = topic.trim().length >= 3 && !isGeneratingScript;

  async function handleGenerateScript() {
    if (!canGenerateScript) return;
    setIsGeneratingScript(true);
    setJobError(null);
    setScriptPreview(null);
    try {
      const res = await fetch("/api/videos/whiteboard/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "whiteboard",
          provider: providerChoice,
          qualityPreference,
          styleId: "whiteboard-default",
          topic: topic.trim(),
          mood,
          language,
          durationSec,
          aspectRatio,
          cta: cta.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        script: ScriptPreview;
        clipSpec: ClipSpec;
      };
      setScriptPreview(data.script);
      setClipSpecPreview(data.clipSpec);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Script generation failed");
    } finally {
      setIsGeneratingScript(false);
    }
  }

  async function handleStartRender() {
    if (!scriptPreview) return;
    setIsSubmittingRender(true);
    setJobError(null);
    setJobStatus("queued");
    try {
      const res = await fetch("/api/videos/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "whiteboard",
          provider: providerChoice,
          qualityPreference,
          styleId: "whiteboard-default",
          topic: topic.trim(),
          mood,
          language,
          durationSec,
          aspectRatio,
          cta: cta.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { jobId: string };
      setJobId(data.jobId);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Render start failed");
      setJobStatus("failed");
    } finally {
      setIsSubmittingRender(false);
    }
  }

  const pollJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/videos/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as PollResponse;
      setJobStatus(data.status);
      if (data.status === "complete") {
        setFinalAssets(data.finalAssets ?? []);
      } else if (data.status === "failed") {
        setJobError(data.error ?? "Generation failed");
      }
    } catch {
      // silent — next tick retries
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || jobStatus === "complete" || jobStatus === "failed") return;
    const interval = setInterval(pollJob, 5_000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, pollJob]);

  function reset() {
    setJobId(null);
    setJobStatus(null);
    setScriptPreview(null);
    setClipSpecPreview(null);
    setFinalAssets([]);
    setJobError(null);
    setTopic("");
    setCta("");
  }

  const isRendering =
    jobStatus !== null &&
    jobStatus !== "complete" &&
    jobStatus !== "failed" &&
    (jobStatus === "queued" ||
      jobStatus === "scripting" ||
      jobStatus === "generating_clips" ||
      jobStatus === "waiting_compose" ||
      jobStatus === "composing");

  const hasScript = scriptPreview !== null;
  const hasResult = jobStatus === "complete" && finalAssets.length > 0;
  const hasFailed = jobStatus === "failed";

  const previewAspect = aspectRatio;
  const previewAspectClass =
    previewAspect === "9:16"
      ? "aspect-[9/16] max-w-[260px] mx-auto"
      : previewAspect === "1:1"
        ? "aspect-square"
        : "aspect-video";

  const progressStages: Array<{ key: JobStatus | "queued"; label: string }> = [
    { key: "queued", label: "Script ready" },
    { key: "generating_clips", label: `Generating clip 1/${livePreview.clipCount}` },
    { key: "waiting_compose", label: "All clips ready" },
    { key: "composing", label: "Merging" },
    { key: "complete", label: "Uploading" },
    { key: "complete", label: "Complete" },
  ];

  function isStageDone(stageIdx: number): boolean {
    if (!jobStatus) return false;
    const order: JobStatus[] = [
      "queued",
      "generating_clips",
      "waiting_compose",
      "composing",
      "complete",
    ];
    const cur = order.indexOf(jobStatus === "failed" ? "composing" : jobStatus);
    return cur >= stageIdx;
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title={title}
        subtitle={subtitle}
        cta={
          <Link
            href="/dashboard/videos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ArrowRight className="size-3.5 rotate-180" />
            All video tools
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Step 1 — Topic & Style */}
          <Panel step="1" title="Topic & style">
            <Field label="What is your video about?">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 300))}
                placeholder="e.g. How small businesses can use AI to 10x their content output"
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="mt-1 text-[11px] text-zinc-500 text-end">
                {topic.length}/300
              </p>
            </Field>
            <Field label="Mood">
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const active = m.id === mood;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={
                        "rounded-full border px-3 h-8 text-xs font-medium transition-all " +
                        (active
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300")
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Language">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </Panel>

          {/* Step 2 — Format */}
          <Panel step="2" title="Format">
            <Field label="Duration">
              <div className="flex flex-wrap items-center gap-2">
                {DURATIONS.map((d) => {
                  const active = d.value === durationSec;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDurationSec(d.value)}
                      className={
                        "rounded-md border px-4 h-9 text-sm font-medium transition-all " +
                        (active
                          ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Aspect ratio">
              <div className="flex flex-wrap items-center gap-2">
                {ASPECT_RATIOS.map((ar) => {
                  const active = ar.value === aspectRatio;
                  return (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      className={
                        "inline-flex items-center gap-2 rounded-md border px-3 h-9 text-sm font-medium transition-all " +
                        (active
                          ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      <span aria-hidden>{ar.icon}</span>
                      {ar.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field
              label={
                <span>
                  Call to action
                  <span className="ms-1 text-xs text-zinc-500 font-normal">
                    (optional)
                  </span>
                </span>
              }
            >
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value.slice(0, 100))}
                placeholder="e.g. Sign up free at example.com"
                maxLength={100}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
          </Panel>

          {/* Step 3 — Model */}
          <Panel step="3" title="Video model">
            <Field label="Quality preference">
              <div className="flex flex-wrap items-center gap-2">
                {(["budget", "quality"] as const).map((q) => {
                  const active = qualityPreference === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQualityPreference(q)}
                      className={
                        "rounded-md border px-3 h-8 text-xs font-medium transition-all " +
                        (active
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300")
                      }
                    >
                      {q === "budget" ? "Budget (faster)" : "Quality (slower)"}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROVIDER_CARDS.map((p) => {
                const Icon = p.icon;
                const active = providerChoice === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProviderChoice(p.id)}
                    className={
                      "text-start rounded-xl border p-3 transition-all " +
                      (active
                        ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300")
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={
                          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg " +
                          (active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700")
                        }
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{p.label}</p>
                          <span
                            className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${p.badgeCls}`}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-600">{p.blurb}</p>
                        <p className="mt-1 text-[11px] text-zinc-500 font-mono">
                          {p.estCostPer30s} per 30s
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
              <span className="font-semibold">Preview:</span>{" "}
              <span className="font-mono">
                {livePreview.clipCount} clips × {livePreview.clipDurationSec}s
              </span>{" "}
              ={" "}
              <span className="font-mono">{livePreview.actualTotalSec}s</span> via{" "}
              <span className="font-mono">{livePreview.provider}</span>
            </div>
          </Panel>

          {/* Step 4 — Script preview */}
          <Panel
            step="4"
            title="Script preview"
            subtitle="Review the AI-generated script, then start the render."
          >
            {!hasScript ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <p className="text-sm text-zinc-600">
                  Fill in the topic above, then click <strong>Generate script</strong>{" "}
                  to see what the AI will produce.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
                  <span className="font-semibold">{scriptPreview.clipCount} phases</span>{" "}
                  · {scriptPreview.totalSec}s total · {scriptPreview.clipDurationSec}s per clip
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {scriptPreview.phases.map((p) => (
                    <div
                      key={p.index}
                      className="rounded-lg border border-zinc-200 bg-white p-3"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-zinc-700">
                          {p.index + 1}. {p.label}
                        </p>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {p.durationSec}s
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-900">
                        <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold me-1">
                          Voiceover
                        </span>
                        {p.voiceover}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold me-1">
                          On-screen
                        </span>
                        <span className="font-mono">{p.onScreenText}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {jobError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{jobError}</span>
            </div>
          ) : null}

          {/* Action row */}
          <div className="flex items-center justify-end gap-2">
            {!hasScript ? (
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={!canGenerateScript}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isGeneratingScript ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                Generate script
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRender}
                disabled={isSubmittingRender || isRendering}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isSubmittingRender ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {tw("generate")}
              </button>
            )}
          </div>
        </div>

        {/* Right column — sticky live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Preview</p>
              {hasResult ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                  <Check className="size-3" />
                  Rendered
                </span>
              ) : null}
            </div>

            <div
              className={`mt-3 w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center ${previewAspectClass}`}
            >
              {hasResult && finalAssets[0] ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={finalAssets[0].assetUrl}
                  controls
                  className="size-full object-contain bg-black"
                />
              ) : isRendering ? (
                <div className="flex flex-col items-center gap-3 text-zinc-500 p-4">
                  <Loader2 className="size-5 animate-spin" />
                  <ol className="space-y-1 text-xs text-center">
                    {progressStages.map((s, idx) => (
                      <li
                        key={idx}
                        className={
                          "flex items-center justify-center gap-1.5 " +
                          (isStageDone(idx) ? "text-emerald-700" : "")
                        }
                      >
                        {isStageDone(idx) ? (
                          <Check className="size-3" />
                        ) : (
                          <span className="inline-block size-2 rounded-full bg-zinc-300" />
                        )}
                        {idx === 1 && jobStatus === "generating_clips"
                          ? `Generating clip 1/${livePreview.clipCount}`
                          : s.label}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : hasFailed ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <AlertCircle className="size-6" />
                  <p className="text-xs">{tw("generation_failed")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <ImageIcon className="size-6" />
                  <p className="text-xs">Describe a topic to begin.</p>
                </div>
              )}
            </div>

            {hasResult ? (
              <div className="mt-4 space-y-3">
                <Meta label="Clips" value={String(livePreview.clipCount)} />
                <Meta label="Ratio" value={aspectRatio} />
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Link
                    href="/dashboard/assets"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
                  >
                    <Check className="size-3.5" />
                    Open in Media Library
                  </Link>
                  {finalAssets[0] ? (
                    <a
                      href={finalAssets[0].assetUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
                    >
                      {tw("download")}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {hasResult ? (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
                >
                  <RefreshCw className="size-3.5" />
                  {tw("make_another")}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 space-y-1">
            <p className="text-sm font-semibold text-zinc-700">How it works</p>
            <p>
              Step 1 writes a structured script with Groq (fast, ~1s). Each clip is
              generated separately, then concatenated by a dedicated FFmpeg worker.
            </p>
            <p className="flex items-start gap-1.5 pt-1">
              <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
              <span>You can leave this page — we&apos;ll keep processing server-side.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
