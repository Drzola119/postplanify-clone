"use client";

/**
 * Carousel Studio wizard.
 *
 * Four steps, in order:
 *   1. Pick a style (M1 ships one hard-coded default — Palette Builder
 *      and Brand Analyzer ship in M2 / M3).
 *   2. Topic + CTA keyword + optional niche/tone.
 *   3. Script preview — Groq-generated 5 lines, editable inline.
 *   4. Generate slides — polls the job, shows per-slide status, lets
 *      the user regenerate any individual slide.
 *
 * Hand-off: when all slides are complete, the wizard exposes a
 * "Use in a post" button that emits the final CarouselItem[] via
 * `onComplete` (default behaviour: scroll back to the top with a
 * success banner — wire `onComplete` from a parent to integrate with
 * the existing composer).
 *
 * Platform design system: zinc/pastel, no gradients on cards, no emoji.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Sparkles,
  Check,
  RefreshCw,
  Wand2,
  ArrowRight,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, Field, Meta } from "@/components/dashboard/wizard-kit";
import { CarouselStylePicker } from "@/components/dashboard/carousel-style-picker";
import {
  SLIDE_COUNT,
  type CarouselScript,
  type CarouselSlideScript,
  type CarouselStyle,
  type SlideType,
} from "@/lib/carousel-gen/types";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";
import { OUTPUT_LANGUAGE_LABELS, type OutputLanguage } from "@/lib/i18n/types";

interface CarouselWizardProps {
  /** M1: passed through from the page that mounted the wizard. M2+:
   * the user picks their own style inside the wizard, so this seed id
   * is just the initial selection (always the default). Kept on the
   * signature so the server-rendered page contract doesn't change. */
  styleId?: string;
}

interface PreviewResponse {
  script: CarouselScript;
}

interface GenerateResponse {
  jobId: string;
  status: string;
}

interface JobPollResponse {
  jobId: string;
  status: "scripting" | "generating_slides" | "complete" | "failed";
  slides: Array<{
    index: number;
    type: SlideType;
    assetUrl: string;
    assetId: string;
    status: "pending" | "generating" | "complete" | "failed";
    provider?: string;
    costUsd?: number;
    width?: number;
    height?: number;
    errorMessage?: string;
  }>;
  costUsd: number;
  hasFailures?: boolean;
  error?: string | null;
  visionQa?: {
    status: "running" | "complete" | "failed";
    drift: number[];
    notes: string;
    error?: string;
  } | null;
}

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
type StepKey = (typeof STEP_KEYS)[number];

const OUTPUT_LANGS: OutputLanguage[] = ["en", "fr", "ar"];

const ROLE_KEYS: Record<SlideType, string> = {
  hook: "slide_role_hook",
  stakes: "slide_role_stakes",
  value: "slide_role_value",
  receipts: "slide_role_receipts",
  cta: "slide_role_cta",
};

export function CarouselWizard({ styleId: initialStyleId }: CarouselWizardProps) {
  const t = useTranslations("dashboard.carousels.wizard");

  const [step, setStep] = useState<StepKey>("step1");

  // Step 1 — style. Defaults to the built-in style; the M2 picker can
  // override it from the user's saved-palette list.
  const [selectedStyle, setSelectedStyle] = useState<CarouselStyle>(() => {
    if (initialStyleId && initialStyleId === DEFAULT_CAROUSEL_STYLE.id) {
      return DEFAULT_CAROUSEL_STYLE;
    }
    return DEFAULT_CAROUSEL_STYLE;
  });

  // Step 2 state
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [ctaKeyword, setCtaKeyword] = useState("OPEN");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("en");

  // Step 3 — script preview
  const [script, setScript] = useState<CarouselScript | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Step 4 — generation
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobPollResponse | null>(null);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const canPreview =
    topic.trim().length >= 3 && ctaKeyword.trim().length >= 1;

  async function handlePreview() {
    if (!canPreview) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/carousels/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          niche: niche.trim() || undefined,
          tone: tone.trim() || undefined,
          ctaKeyword: ctaKeyword.trim(),
          outputLanguage,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? `Preview failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as PreviewResponse;
      setScript(data.script);
      setStep("step3");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleCommit() {
    if (!script) return;
    setCommitting(true);
    setError(null);
    try {
      // M2+: include the full style snapshot when the user picked a
      // custom palette. The server validates it and persists it on
      // the job doc — the default style uses its registry id only.
      const isCustomStyle = selectedStyle.id !== DEFAULT_CAROUSEL_STYLE.id;
      const res = await fetch("/api/carousels", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: script.topic,
          niche: script.niche,
          tone: script.tone,
          ctaKeyword: script.ctaKeyword,
          outputLanguage: script.outputLanguage,
          styleId: selectedStyle.id,
          styleSnapshot: isCustomStyle ? selectedStyle : undefined,
          slides: script.slides,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? `Generation failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as GenerateResponse;
      setJobId(data.jobId);
      setStep("step4");
      // Start polling immediately.
      void pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setCommitting(false);
    }
  }

  async function pollJob(id: string) {
    try {
      const res = await fetch(`/api/carousels/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        stopPolling();
        setError(`Polling failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as JobPollResponse;
      setJob(data);
      if (
        data.status === "scripting" ||
        data.status === "generating_slides"
      ) {
        pollRef.current = setTimeout(() => void pollJob(id), 2_000);
      } else {
        stopPolling();
      }
    } catch (err) {
      stopPolling();
      setError(err instanceof Error ? err.message : "Polling failed");
    }
  }

  async function handleRegenerateSlide(index: number) {
    if (!jobId) return;
    setRegeneratingIndex(index);
    setError(null);
    try {
      const res = await fetch(
        `/api/carousels/${jobId}/slides/${index}/regenerate`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? `Regenerate failed (${res.status})`);
        return;
      }
      // Refresh job state so the new URL appears.
      await pollJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setRegeneratingIndex(null);
    }
  }

  function updateSlide(index: number, patch: Partial<CarouselSlideScript>) {
    if (!script) return;
    setScript({
      ...script,
      slides: script.slides.map((s) => (s.index === index ? { ...s, ...patch } : s)),
    });
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title={t("step1_title")}
        subtitle={t("step1_subtitle")}
        cta={
          <button
            type="button"
            onClick={() => setStep("step1")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ArrowRight className="size-3.5 rotate-180" />
            {t("back_to_script_button")}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Step 1 — Style. M2 lets the user pick from saved palettes
              or build a new one. */}
          <Panel
            step="1"
            title={t("style_picker_title")}
            subtitle={t("style_picker_subtitle")}
          >
            <CarouselStylePicker
              selectedId={selectedStyle.id}
              onSelect={setSelectedStyle}
            />
          </Panel>

          {/* Step 2 — Inputs */}
          <Panel step="2" title={t("step2_title")} subtitle={t("step2_subtitle")}>
            <Field label={t("topic_label")}>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("topic_placeholder")}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("niche_label")}>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder={t("niche_placeholder")}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
              <Field label={t("tone_label")}>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder={t("tone_placeholder")}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
            </div>
            <Field label={t("cta_label")}>
              <input
                type="text"
                value={ctaKeyword}
                onChange={(e) => setCtaKeyword(e.target.value)}
                placeholder={t("cta_placeholder")}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
            <Field label={t("output_language_label")}>
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {OUTPUT_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {OUTPUT_LANGUAGE_LABELS[l]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!canPreview || previewing}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                {previewing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {previewing ? t("previewing_label") : t("preview_button")}
              </button>
            </div>
          </Panel>

          {/* Step 3 — Script preview/edit */}
          {script ? (
            <Panel
              step="3"
              title={t("step3_title")}
              subtitle={t("step3_subtitle")}
            >
              <div className="space-y-3">
                {script.slides.map((slide) => (
                  <ScriptRow
                    key={slide.index}
                    slide={slide}
                    onChange={(patch) => updateSlide(slide.index, patch)}
                    roleLabel={t(ROLE_KEYS[slide.type])}
                    slideNOfMLabel={t("slide_n_of_m", {
                      n: slide.index + 1,
                      m: SLIDE_COUNT,
                    })}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void handlePreview()}
                  disabled={previewing}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" />
                  {t("regenerate_script_button")}
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={committing}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {committing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  {committing ? t("committing_label") : t("commit_button")}
                </button>
              </div>
            </Panel>
          ) : null}

          {/* Step 4 — Generation results */}
          {jobId && job ? (
            <Panel
              step="4"
              title={t("step4_title")}
              subtitle={t("step4_subtitle")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {job.slides.map((slide) => (
                  <SlideCard
                    key={slide.index}
                    slide={slide}
                    roleLabel={t(ROLE_KEYS[slide.type])}
                    statusLabel={
                      slide.status === "pending"
                        ? t("status_pending")
                        : slide.status === "generating"
                          ? t("status_generating")
                          : slide.status === "complete"
                            ? t("status_complete")
                            : t("status_failed")
                    }
                    regenerating={regeneratingIndex === slide.index}
                    onRegenerate={() => void handleRegenerateSlide(slide.index)}
                    regenerateLabel={t("regenerate_slide_button")}
                    regeneratingLabel={t("regenerating_slide_label")}
                    drift={
                      job.visionQa?.status === "complete" &&
                      job.visionQa.drift.includes(slide.index)
                    }
                    driftLabel={t("slide_drift_badge")}
                  />
                ))}
              </div>
              {job.visionQa?.status === "complete" && job.visionQa.notes ? (
                <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700">
                  {job.visionQa.notes}
                </div>
              ) : null}
              <div className="pt-2">
                <Meta
                  label={t("step4_title")}
                  value={`${job.status}${job.hasFailures ? " (some failed)" : ""}`}
                />
                <Meta
                  label="Cost"
                  value={t("cost_so_far", {
                    usd: job.costUsd.toFixed(4),
                  })}
                />
              </div>
            </Panel>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Tiny progress indicator so the user knows where they are. */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {STEP_KEYS.map((s, i) => (
              <span
                key={s}
                className={
                  "inline-flex size-6 items-center justify-center rounded-full " +
                  (s === step
                    ? "bg-zinc-900 text-white font-semibold"
                    : "bg-zinc-100 text-zinc-500")
                }
              >
                {i + 1}
              </span>
            ))}
            <span className="ms-1">
              {step === "step1"
                ? t("step1_title")
                : step === "step2"
                  ? t("step2_title")
                  : step === "step3"
                    ? t("step3_title")
                    : t("step4_title")}
            </span>
          </div>
        </div>

        {/* Right column — full-frame + grid-thumbnail preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t("grid_preview_label")}</p>
              {job?.status === "complete" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                  <Check className="size-3" />
                  {t("status_complete")}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {/* Full frame — 3:4 */}
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center relative">
                {job?.slides?.[0]?.assetUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.slides[0].assetUrl}
                    alt="Slide 1 full frame"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400 p-2 text-center">
                    <ImageIcon className="size-4" />
                    <p className="text-[9px] leading-tight">{t("script_placeholder")}</p>
                  </div>
                )}
              </div>
              {/* Grid thumbnail — 1:1 square crop with safe-zone overlay.
                  The Hook slide must keep headline within the central
                  1080×1215 band so Instagram's grid crop doesn't slice
                  off the words (spec §2). */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center">
                {job?.slides?.[0]?.assetUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.slides[0].assetUrl}
                    alt="Slide 1 grid thumbnail"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400 p-2 text-center">
                    <ImageIcon className="size-4" />
                    <p className="text-[9px]">1:1</p>
                  </div>
                )}
                {/* Safe-zone overlay: the central band the headline must
                    stay within. Drawn as two thin dashed lines so the
                    user can see the boundaries at a glance. */}
                <div
                  className="pointer-events-none absolute inset-x-0 border-y border-dashed border-emerald-500/70"
                  style={{
                    top: "11.7%",
                    bottom: "11.7%",
                  }}
                  aria-hidden
                />
                <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                  {t("grid_safe_zone_badge")}
                </span>
              </div>
              {/* Middle band preview — the headline's survival zone in
                  isolation. Shows the user exactly where text must sit. */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center">
                {job?.slides?.[0]?.assetUrl ? (
                  <div
                    className="size-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${job.slides[0].assetUrl})`,
                      backgroundPosition: "center",
                      // Crop to the middle band — emulate Instagram's grid
                      // thumbnail region (spec §2: 1080×1215 of 1080×1440
                      // ≈ 84% tall, centred)
                      clipPath:
                        "polygon(0 12%, 100% 12%, 100% 88%, 0 88%)",
                    }}
                    aria-hidden
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400 p-2 text-center">
                    <ImageIcon className="size-4" />
                    <p className="text-[9px] leading-tight">
                      {t("grid_safe_zone_label")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {job?.status === "complete" && job.slides.every((s) => s.status === "complete") ? (
              <button
                type="button"
                onClick={() => {
                  // M1 hand-off: the wizard emits the asset URLs to the
                  // console so a parent component can pick them up. When
                  // the composer integration lands, wire this to a
                  // callback that downloads each asset and constructs
                  // a CarouselItem[] for CarouselMediaCard.
                  console.log("[carousel-studio] ready for composer", job.slides.map((s) => s.assetUrl));
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold"
              >
                <Check className="size-4" />
                {t("use_in_post_button")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScriptRow({
  slide,
  onChange,
  roleLabel,
  slideNOfMLabel,
}: {
  slide: CarouselSlideScript;
  onChange: (patch: Partial<CarouselSlideScript>) => void;
  roleLabel: string;
  slideNOfMLabel: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-semibold">
            {slide.index + 1}
          </span>
          <span className="text-xs font-semibold text-zinc-700">{roleLabel}</span>
          <span className="text-[11px] text-zinc-500">{slideNOfMLabel}</span>
        </div>
      </div>
      <input
        type="text"
        value={slide.headline}
        onChange={(e) => onChange({ headline: e.target.value })}
        className="mt-2 w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
      <input
        type="text"
        value={slide.body ?? ""}
        onChange={(e) => onChange({ body: e.target.value || undefined })}
        placeholder="(optional)"
        className="mt-2 w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}

function SlideCard({
  slide,
  roleLabel,
  statusLabel,
  regenerating,
  onRegenerate,
  regenerateLabel,
  regeneratingLabel,
  drift,
  driftLabel,
}: {
  slide: JobPollResponse["slides"][number];
  roleLabel: string;
  statusLabel: string;
  regenerating: boolean;
  onRegenerate: () => void;
  regenerateLabel: string;
  regeneratingLabel: string;
  drift?: boolean;
  driftLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-semibold shrink-0">
            {slide.index + 1}
          </span>
          <span className="text-xs font-semibold text-zinc-700 truncate">{roleLabel}</span>
          {drift ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
              {driftLabel ?? "Drift"}
            </span>
          ) : null}
        </div>
        <StatusPill status={slide.status} label={statusLabel} />
      </div>
      <div className="mt-2 aspect-[3/4] overflow-hidden rounded-md bg-zinc-100 border border-zinc-200 grid place-items-center">
        {slide.status === "complete" && slide.assetUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.assetUrl}
            alt={roleLabel}
            className="size-full object-cover"
          />
        ) : slide.status === "generating" || regenerating ? (
          <Loader2 className="size-5 animate-spin text-zinc-500" />
        ) : slide.status === "failed" ? (
          <span className="text-[10px] text-red-600 px-2 text-center">
            {slide.errorMessage ?? statusLabel}
          </span>
        ) : (
          <ImageIcon className="size-5 text-zinc-300" />
        )}
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={regenerating}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
      >
        {regenerating ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <RefreshCw className="size-3" />
        )}
        {regenerating ? regeneratingLabel : regenerateLabel}
      </button>
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: "pending" | "generating" | "complete" | "failed";
  label: string;
}) {
  const cls =
    status === "complete"
      ? "bg-emerald-50 text-emerald-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : status === "generating"
          ? "bg-amber-50 text-amber-700"
          : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
