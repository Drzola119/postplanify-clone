"use client";

// RTL AUDIT LOG — directional classes migrated to logical properties where used:
//   ms-1 (label gaps) and ms-2 (button icon gaps) are already logical;
//   no ml-/mr-/pl-/pr-/left-/right-/rounded-l-/rounded-r-/border-l-/border-r-
//   classes exist in this file. Layout uses gap-* and flex with no fixed
//   inset/translate X-offsets, so the two-column shell mirrors correctly in RTL.

/**
 * cartoon-video-wizard.tsx
 * Multi-step wizard for the Cartoon-Style Video workflow.
 * Visual + structural redesign (2026-07-30): now mirrors
 * infographic-wizard.tsx — two-column layout with numbered Panels on the
 * left and a sticky live preview on the right. Replaces the previous
 * single-column step-through.
 *
 * State is held entirely client-side; the wizard polls /api/videos/[jobId]
 * every 5s while a job is active.
 *
 * Steps (left column, all visible at once):
 *   1. Style (cartoon sub-style grid)
 *   2. Content (topic + optional dialogue)
 *   3. Settings (duration + aspect ratios)
 *   [Generate button at the bottom of the left column]
 *
 * Right column (sticky):
 *   empty → generating → polling status → finished video player with
 *   Meta rows (provider, cost, duration, ratio) and download action.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Check,
  RefreshCw,
  Wand2,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, Field, Meta } from "@/components/dashboard/wizard-kit";
import type { CartoonSubStyle } from "@/lib/video-gen/workflows/cartoon";
import type { VideoAspectRatio } from "@/lib/video-gen/types";

const SUBSTYLES: { id: CartoonSubStyle; label: string; description: string }[] = [
  { id: "pixar-3d", label: "3D Pixar-Style", description: "Cinematic 3D animation" },
  { id: "flat-2d", label: "Flat 2D", description: "Clean vector motion-graphics" },
  { id: "anime", label: "Anime", description: "Japanese animation style" },
  { id: "saturday-morning", label: "Saturday Morning", description: "Retro 80s cartoon" },
];

const DURATIONS: { label: string; value: 5 | 8 | 10 | 15 }[] = [
  { label: "5s", value: 5 },
  { label: "8s", value: 8 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
];

const ASPECT_RATIOS: { label: string; value: VideoAspectRatio }[] = [
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
];

type JobStatus = "queued" | "generating_clips" | "composing" | "complete" | "failed";

type FinalAsset = { aspectRatio: string; assetId: string; assetUrl: string };

interface PollResponse {
  jobId: string;
  status: JobStatus;
  provider?: string;
  costUsd?: number;
  durationMs?: number;
  finalAssets?: FinalAsset[];
  error?: string | null;
}

interface CartoonVideoWizardProps {
  title: string;
  subtitle: string;
}

export function CartoonVideoWizard({ title, subtitle }: CartoonVideoWizardProps) {
  const t = useTranslations("videos");
  const tw = useTranslations("videos.wizard");

  const [subStyle, setSubStyle] = useState<CartoonSubStyle>("pixar-3d");
  const [topic, setTopic] = useState("");
  const [dialogueLine, setDialogueLine] = useState("");
  const [durationSec, setDurationSec] = useState<5 | 8 | 10 | 15>(8);
  const [aspectRatios, setAspectRatios] = useState<VideoAspectRatio[]>(["16:9"]);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [finalAssets, setFinalAssets] = useState<FinalAsset[]>([]);
  const [jobMeta, setJobMeta] = useState<{
    provider?: string;
    costUsd?: number;
    durationMs?: number;
  }>({});
  const [jobError, setJobError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAspectRatio(ar: VideoAspectRatio) {
    setAspectRatios((prev) =>
      prev.includes(ar)
        ? prev.length > 1
          ? prev.filter((x) => x !== ar)
          : prev
        : prev.length < 3
          ? [...prev, ar]
          : prev
    );
  }

  function canSubmit(): boolean {
    return topic.trim().length >= 3;
  }

  async function handleGenerate() {
    if (!canSubmit()) return;
    setIsSubmitting(true);
    setJobError(null);
    setFinalAssets([]);
    setJobMeta({});
    setJobStatus("queued");
    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "cartoon",
          provider: "auto",
          styleId: `cartoon-${subStyle}`,
          aspectRatios,
          topic: topic.trim() || undefined,
          subStyle,
          durationSec,
          dialogueLine: dialogueLine.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { jobId: string };
      setJobId(data.jobId);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Something went wrong");
      setJobStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const pollJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/videos/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as PollResponse;
      setJobStatus(data.status);
      if (data.provider !== undefined) setJobMeta((m) => ({ ...m, provider: data.provider }));
      if (typeof data.costUsd === "number") setJobMeta((m) => ({ ...m, costUsd: data.costUsd }));
      if (typeof data.durationMs === "number")
        setJobMeta((m) => ({ ...m, durationMs: data.durationMs }));

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
    setFinalAssets([]);
    setJobMeta({});
    setJobError(null);
    setTopic("");
    setDialogueLine("");
  }

  const isGenerating =
    jobStatus !== null &&
    jobStatus !== "complete" &&
    jobStatus !== "failed" &&
    (isSubmitting || jobStatus === "queued" || jobStatus === "generating_clips" || jobStatus === "composing");

  const hasResult = jobStatus === "complete" && finalAssets.length > 0;
  const hasFailed = jobStatus === "failed";

  const previewAspect = aspectRatios[0] ?? "16:9";
  const previewAspectClass =
    previewAspect === "9:16"
      ? "aspect-[9/16] max-w-[260px] mx-auto"
      : previewAspect === "1:1"
        ? "aspect-square"
        : "aspect-video";

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
        {/* Left column — stacked Panels */}
        <div className="space-y-6">
          {/* Step 1 — Style */}
          <Panel step="1" title={t("cartoon.step_style")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUBSTYLES.map((s) => {
                const active = s.id === subStyle;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubStyle(s.id)}
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
                          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full " +
                          (active ? "bg-zinc-900 text-white" : "border border-zinc-300")
                        }
                      >
                        {active && <Check className="size-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-600">{s.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Step 2 — Content */}
          <Panel step="2" title={t("cartoon.step_content")}>
            <Field label={t("cartoon.topic_label")}>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("cartoon.topic_placeholder")}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
            <Field
              label={
                <span>
                  {t("cartoon.dialogue_label")}
                  <span className="ms-1 text-xs text-zinc-500 font-normal">
                    ({t("wizard.optional")})
                  </span>
                </span>
              }
            >
              <input
                type="text"
                value={dialogueLine}
                onChange={(e) => setDialogueLine(e.target.value)}
                placeholder={t("cartoon.dialogue_placeholder")}
                maxLength={200}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
          </Panel>

          {/* Step 3 — Settings */}
          <Panel step="3" title={t("cartoon.step_settings")}>
            <Field label={t("cartoon.duration_label")}>
              <div className="flex flex-wrap items-center gap-2">
                {DURATIONS.map((d) => {
                  const active = d.value === durationSec;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDurationSec(d.value)}
                      className={
                        "rounded-md border px-3 h-9 text-sm font-medium transition-all " +
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
            <Field label={t("cartoon.aspect_ratio_label")}>
              <p className="-mt-1 mb-1 text-[11px] text-zinc-500">{t("cartoon.aspect_ratio_hint")}</p>
              <div className="flex flex-wrap items-center gap-2">
                {ASPECT_RATIOS.map((ar) => {
                  const active = aspectRatios.includes(ar.value);
                  return (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => toggleAspectRatio(ar.value)}
                      className={
                        "rounded-md border px-3 h-9 text-sm font-medium transition-all " +
                        (active
                          ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      {ar.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Panel>

          {jobError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{jobError}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting || !canSubmit()}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {tw("generate")}
            </button>
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
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Loader2 className="size-5 animate-spin" />
                  <p className="text-xs">
                    {jobStatus === "queued" && tw("status_queued")}
                    {jobStatus === "generating_clips" && tw("status_generating")}
                    {jobStatus === "composing" && tw("status_composing")}
                  </p>
                </div>
              ) : hasFailed ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <AlertCircle className="size-6" />
                  <p className="text-xs">{tw("generation_failed")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <ImageIcon className="size-6" />
                  <p className="text-xs">Describe a topic and pick a style to begin.</p>
                </div>
              )}
            </div>

            {hasResult ? (
              <div className="mt-4 space-y-3">
                {jobMeta.provider ? <Meta label="Provider" value={jobMeta.provider} /> : null}
                <Meta label="Ratios" value={finalAssets.map((a) => a.aspectRatio).join(", ")} />
                {typeof jobMeta.costUsd === "number" ? (
                  <Meta label="Cost" value={`$${jobMeta.costUsd.toFixed(4)}`} />
                ) : null}
                {typeof jobMeta.durationMs === "number" ? (
                  <Meta label="Duration" value={`${(jobMeta.durationMs / 1000).toFixed(1)}s`} />
                ) : null}
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
            <p className="text-sm font-semibold text-zinc-700">How billing works</p>
            <p>
              Renders are billed per output. Each aspect ratio you select counts as one
              render. The cost is shown above as soon as the job completes.
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
