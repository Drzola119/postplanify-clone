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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Undo2,
  Calendar,
  Download,
  Languages,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  ImagePlus,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, Field, Meta } from "@/components/dashboard/wizard-kit";
import { CarouselStylePicker } from "@/components/dashboard/carousel-style-picker";
import { ScheduleModal } from "@/components/dashboard/schedule-modal";
import { UnsplashDialog } from "@/components/dashboard/unsplash-dialog";
import { showToast } from "@/components/ui/toast";
import {
  ALLOWED_SLIDE_COUNTS,
  DEFAULT_SLIDE_COUNT,
  type AllowedSlideCount,
  type CarouselScript,
  type CarouselSlideScript,
  type CarouselStyle,
  type SlideType,
} from "@/lib/carousel-gen/types";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";
import { OUTPUT_LANGUAGE_LABELS, type OutputLanguage } from "@/lib/i18n/types";
import { estimateCarouselCostUsd } from "@/lib/image-gen/cost";

interface CarouselWizardProps {
  /** M1: passed through from the page that mounted the wizard. M2+:
   * the user picks their own style inside the wizard, so this seed id
   * is just the initial selection (always the default). Kept on the
   * signature so the server-rendered page contract doesn't change. */
  styleId?: string;
  /** F5: when launched from a template, pre-fill topic + tone + niche. */
  prefill?: Partial<{
    topic: string;
    niche: string;
    tone: string;
    ctaKeyword: string;
    slideCount: AllowedSlideCount;
    styleId: string;
  }>;
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
    backgroundUrl?: string;
    backgroundOpacity?: number;
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

export function CarouselWizard({
  styleId: initialStyleId,
  prefill,
}: CarouselWizardProps) {
  const t = useTranslations("dashboard.carousels.wizard");

  const [step, setStep] = useState<StepKey>("step1");

  // Step 1 — style. Defaults to the built-in style; the M2 picker can
  // override it from the user's saved-palette list.
  const [selectedStyle, setSelectedStyle] = useState<CarouselStyle>(() => {
    if (initialStyleId && initialStyleId === DEFAULT_CAROUSEL_STYLE.id) {
      return DEFAULT_CAROUSEL_STYLE;
    }
    if (prefill?.styleId && prefill.styleId === DEFAULT_CAROUSEL_STYLE.id) {
      return DEFAULT_CAROUSEL_STYLE;
    }
    return DEFAULT_CAROUSEL_STYLE;
  });

  // Step 2 state — prefillable from a template (F5).
  const [topic, setTopic] = useState(prefill?.topic ?? "");
  const [niche, setNiche] = useState(prefill?.niche ?? "");
  const [tone, setTone] = useState(prefill?.tone ?? "");
  const [ctaKeyword, setCtaKeyword] = useState(prefill?.ctaKeyword ?? "OPEN");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("en");
  const [slideCount, setSlideCount] = useState<AllowedSlideCount>(
    prefill?.slideCount ?? DEFAULT_SLIDE_COUNT
  );

  // Step 3 — script preview
  const [script, setScript] = useState<CarouselScript | null>(null);
  const [previewing, setPreviewing] = useState(false);
  /** F3: previous version of each slide for the per-slide Undo button. */
  const [slideUndo, setSlideUndo] = useState<
    Record<number, CarouselSlideScript>
  >({});
  /** F3: which slide is being text-regenerated by AI right now. */
  const [regeneratingTextIndex, setRegeneratingTextIndex] = useState<
    number | null
  >(null);
  /** F10: original-language script kept around so we can revert translation. */
  const [originalScript, setOriginalScript] = useState<CarouselScript | null>(
    null
  );
  const [translating, setTranslating] = useState(false);

  // Step 4 — generation
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobPollResponse | null>(null);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  /** F6: which slide's background picker is open. */
  const [backgroundPickerIndex, setBackgroundPickerIndex] = useState<
    number | null
  >(null);
  /** F4: schedule-modal open state. */
  const [scheduleOpen, setScheduleOpen] = useState(false);
  /** F7: full-screen preview modal state. */
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [fullPreviewIndex, setFullPreviewIndex] = useState(0);
  /** F8: export progress for the toast. */
  const [exporting, setExporting] = useState<null | "pdf" | "zip">(null);

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

  // Cost estimate surfaced next to the Generate slides button. Pure
  // client math — the real cost comes back from the workflow's totalCostUsd
  // and lands in job.costUsd after generation. This estimate just gives
  // the user a number to weigh before they commit.
  const estimatedCostUsd = useMemo(
    () => estimateCarouselCostUsd(slideCount),
    [slideCount]
  );

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
          slideCount,
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
      setOriginalScript(data.script);
      setSlideUndo({});
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
          slideCount: script.slideCount,
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

  /** F3 — rewrite the text of a single slide via the AI. Keeps the rest
   * of the script untouched and stashes the previous version so the user
   * can revert. */
  async function handleRegenerateText(index: number) {
    if (!script) return;
    const slide = script.slides[index];
    if (!slide) return;
    setRegeneratingTextIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/carousels/regenerate-slide-text", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: script.topic,
          tone: script.tone,
          niche: script.niche,
          ctaKeyword: script.ctaKeyword,
          outputLanguage: script.outputLanguage,
          slide,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? `Rewrite failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { slide: CarouselSlideScript };
      setSlideUndo((prev) => ({ ...prev, [index]: script.slides[index] }));
      setScript({
        ...script,
        slides: script.slides.map((s) =>
          s.index === index ? { ...data.slide, index } : s
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewrite failed");
    } finally {
      setRegeneratingTextIndex(null);
    }
  }

  function handleUndoSlideText(index: number) {
    if (!script) return;
    const prev = slideUndo[index];
    if (!prev) return;
    setScript({
      ...script,
      slides: script.slides.map((s) => (s.index === index ? prev : s)),
    });
    setSlideUndo((p) => {
      const next = { ...p };
      delete next[index];
      return next;
    });
  }

  /** F10 — translate the entire script via the AI. Keeps the original
   * in `originalScript` so the user can revert with one click. */
  async function handleTranslate(targetLanguage: string) {
    if (!script) return;
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch("/api/carousels/translate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          targetLanguage,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? `Translate failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { script: CarouselScript };
      if (!originalScript) setOriginalScript(script);
      setScript(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translate failed");
    } finally {
      setTranslating(false);
    }
  }

  function handleRevertTranslation() {
    if (!originalScript) return;
    setScript(originalScript);
    setOriginalScript(null);
  }

  function updateSlide(index: number, patch: Partial<CarouselSlideScript>) {
    if (!script) return;
    setScript({
      ...script,
      slides: script.slides.map((s) => (s.index === index ? { ...s, ...patch } : s)),
    });
  }

  /** F6 — set a slide's background image (URL or data URL). */
  function setSlideBackground(
    index: number,
    backgroundUrl: string | undefined,
    backgroundOpacity?: number
  ) {
    if (!script) return;
    setScript({
      ...script,
      slides: script.slides.map((s) =>
        s.index === index
          ? {
              ...s,
              backgroundUrl,
              backgroundOpacity:
                backgroundOpacity ?? s.backgroundOpacity ?? 35,
            }
          : s
      ),
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

            {/* F1 — Slide count segmented control. */}
            <Field label="Slide count">
              <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
                {ALLOWED_SLIDE_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSlideCount(n)}
                    className={
                      "rounded-sm px-3 py-1 font-medium transition-colors " +
                      (slideCount === n
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900")
                    }
                    aria-pressed={slideCount === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Each slide costs ~$0.10 — {slideCount} slides ≈ $
                {estimatedCostUsd.toFixed(2)}
              </p>
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
                      m: script.slides.length,
                    })}
                    onRegenerateText={() =>
                      void handleRegenerateText(slide.index)
                    }
                    regeneratingText={regeneratingTextIndex === slide.index}
                    canUndo={Boolean(slideUndo[slide.index])}
                    onUndo={() => handleUndoSlideText(slide.index)}
                    onPickBackground={() =>
                      setBackgroundPickerIndex(slide.index)
                    }
                    onRemoveBackground={() =>
                      setSlideBackground(slide.index, undefined, 0)
                    }
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handlePreview()}
                    disabled={previewing}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <RefreshCw className="size-3.5" />
                    {t("regenerate_script_button")}
                  </button>
                  {/* F10 — Translate Script */}
                  <TranslatePopover
                    disabled={translating || !script}
                    onTranslate={handleTranslate}
                    onRevert={handleRevertTranslation}
                    canRevert={Boolean(originalScript)}
                    translating={translating}
                  />
                </div>
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
              <div className="mt-2 rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
                <span className="font-semibold">{t("estimated_cost_label")}</span>{" "}
                <span className="font-mono">~${estimatedCostUsd.toFixed(2)}</span>
                <span className="ms-2 text-zinc-500">
                  {t("estimated_cost_hint")}
                </span>
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

              {/* F4 — Schedule post + F8 — Export dropdown. Visible only
                  when every slide finished (success or fail). */}
              {job.slides.every(
                (s) => s.status === "complete" || s.status === "failed"
              ) && job.slides.some((s) => s.status === "complete") ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
                  >
                    <Calendar className="size-4" />
                    Schedule this Carousel
                  </button>
                  <ExportMenu
                    slides={job.slides
                      .filter((s) => s.status === "complete")
                      .map((s) => s.assetUrl)}
                    carouselTitle={script?.topic ?? "carousel"}
                    onStart={(kind) => setExporting(kind)}
                    onDone={() => {
                      setExporting(null);
                      showToast({ tone: "success", title: "Download ready" });
                    }}
                    onError={(err) => {
                      setExporting(null);
                      showToast({ tone: "error", title: err });
                    }}
                  />
                </div>
              ) : null}

              {exporting ? (
                <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600">
                  <Loader2 className="inline size-3 animate-spin me-1" />
                  Preparing {exporting === "zip" ? "ZIP" : "PDF"}…
                </div>
              ) : null}
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

        {/* Right column — live slide preview + actions */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Live preview</p>
              <div className="flex items-center gap-2">
                {job?.status === "complete" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                    <Check className="size-3" />
                    {t("status_complete")}
                  </span>
                ) : null}
                {/* F7 — Full Preview trigger (only useful once script exists) */}
                {script ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFullPreviewIndex(0);
                      setFullPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Maximize2 className="size-3" />
                    Full Preview
                  </button>
                ) : null}
              </div>
            </div>

            {/* F7 — Live preview list. Shows mock slides derived from
                the script + selected style until real rendered images
                arrive, then swaps to the rendered images. */}
            <LivePreviewPanel
              script={script}
              style={selectedStyle}
              renderedSlides={job?.slides}
            />
          </div>
        </div>
      </div>

      {/* F6 — per-slide background picker modal. */}
      {backgroundPickerIndex !== null && script ? (
        <BackgroundPickerModal
          open
          onClose={() => setBackgroundPickerIndex(null)}
          onPick={(url) => {
            setSlideBackground(backgroundPickerIndex, url);
            setBackgroundPickerIndex(null);
          }}
          initialOpacity={
            script.slides[backgroundPickerIndex]?.backgroundOpacity ?? 35
          }
        />
      ) : null}

      {/* F4 — schedule modal pre-populated with the rendered deck. */}
      {scheduleOpen && job && script ? (
        <ScheduleModal
          open
          onClose={() => setScheduleOpen(false)}
          onConfirm={async (date) => {
            setScheduleOpen(false);
            // Save the carousel record first so the analytics page and
            // carousels list can pick it up, then forward to the posts
            // composer with the rendered media URLs.
            try {
              const completedSlides = job.slides
                .filter((s) => s.status === "complete")
                .map((s) => s.assetUrl);
              await fetch("/api/carousels/save", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jobId,
                  title: script.topic,
                  status: "scheduled",
                  scheduledAt: date.toISOString(),
                  mediaUrls: completedSlides,
                }),
              });
              // Navigate to the composer with the first slide pre-attached.
              // The composer also reads from the user's media library, so
              // the rest of the deck is one click away in the media tab.
              const params = new URLSearchParams();
              if (completedSlides[0]) {
                params.set("mediaUrl", completedSlides[0]);
                params.set("mediaType", "image");
              }
              params.set("caption", script.topic);
              showToast({
                tone: "success",
                title: "Carousel saved — opening composer",
              });
              window.location.href = `/dashboard/posts/create?${params.toString()}`;
            } catch (err) {
              showToast({
                tone: "error",
                title: err instanceof Error ? err.message : "Schedule failed",
              });
            }
          }}
        />
      ) : null}

      {/* F7 — full-screen 1:1 preview modal with left/right navigation. */}
      {fullPreviewOpen && script ? (
        <FullPreviewModal
          open
          slides={script.slides}
          style={selectedStyle}
          renderedSlides={job?.slides}
          index={fullPreviewIndex}
          onIndexChange={setFullPreviewIndex}
          onClose={() => setFullPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ScriptRow({
  slide,
  onChange,
  roleLabel,
  slideNOfMLabel,
  onRegenerateText,
  regeneratingText,
  canUndo,
  onUndo,
  onPickBackground,
  onRemoveBackground,
}: {
  slide: CarouselSlideScript;
  onChange: (patch: Partial<CarouselSlideScript>) => void;
  roleLabel: string;
  slideNOfMLabel: string;
  /** F3 — AI text regeneration for this single slide. */
  onRegenerateText: () => void;
  regeneratingText: boolean;
  canUndo: boolean;
  onUndo: () => void;
  /** F6 — open the background picker for this slide. */
  onPickBackground: () => void;
  onRemoveBackground: () => void;
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
        <div className="flex items-center gap-1">
          {canUndo ? (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              aria-label="Undo regeneration"
            >
              <Undo2 className="size-3" />
              Undo
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRegenerateText}
            disabled={regeneratingText}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium hover:bg-zinc-50 disabled:opacity-50"
            aria-label="Regenerate this slide"
          >
            {regeneratingText ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            Rewrite
          </button>
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
      {/* F6 — per-slide background picker trigger + remove. */}
      <div className="mt-2 flex items-center gap-2">
        {slide.backgroundUrl ? (
          <div className="flex flex-1 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.backgroundUrl}
              alt=""
              className="h-6 w-10 rounded border border-zinc-200 object-cover"
            />
            <span className="text-[11px] text-zinc-500">
              Background · {slide.backgroundOpacity ?? 35}% opacity
            </span>
            <button
              type="button"
              onClick={onPickBackground}
              className="text-[11px] text-zinc-500 hover:text-zinc-900"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemoveBackground}
              className="text-[11px] text-zinc-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickBackground}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <ImagePlus className="size-3" />
            Set Background
          </button>
        )}
      </div>
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

// ============================================================
// F10 — Translate script popover
// ============================================================
const TRANSLATE_LANGUAGES: ReadonlyArray<{ id: string; label: string }> = [
  { id: "en", label: "English" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
  { id: "de", label: "German" },
  { id: "pt", label: "Portuguese" },
  { id: "ar", label: "Arabic" },
  { id: "ja", label: "Japanese" },
  { id: "zh", label: "Chinese" },
  { id: "hi", label: "Hindi" },
  { id: "nl", label: "Dutch" },
  { id: "it", label: "Italian" },
];

function TranslatePopover({
  disabled,
  onTranslate,
  onRevert,
  canRevert,
  translating,
}: {
  disabled: boolean;
  onTranslate: (lang: string) => void;
  onRevert: () => void;
  canRevert: boolean;
  translating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("fr");

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
      >
        {translating ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Languages className="size-3.5" />
        )}
        {translating ? "Translating…" : "Translate"}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg p-3">
            <label className="block text-[11px] font-semibold text-zinc-700">
              Translate to
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="mt-1 w-full h-8 px-2 rounded-md border border-zinc-200 text-sm"
              >
                {TRANSLATE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onTranslate(lang);
              }}
              disabled={translating}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <Languages className="size-3.5" />
              Translate All Slides
            </button>
            {canRevert ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onRevert();
                }}
                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 h-8 rounded-md border border-amber-200 bg-amber-50 px-3 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
              >
                <Undo2 className="size-3" />
                Revert to Original
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ============================================================
// F8 — Export menu (PDF / ZIP) — packages all rendered slides
// ============================================================
function ExportMenu({
  slides,
  carouselTitle,
  onStart,
  onDone,
  onError,
}: {
  slides: string[];
  carouselTitle: string;
  onStart: (kind: "pdf" | "zip") => void;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);

  async function handleExport(kind: "pdf" | "zip") {
    setOpen(false);
    onStart(kind);
    try {
      if (kind === "zip") {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (let i = 0; i < slides.length; i++) {
          const url = slides[i];
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch slide ${i + 1}`);
          const blob = await res.blob();
          zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
        }
        const out = await zip.generateAsync({ type: "blob" });
        triggerDownload(out, `${slug(carouselTitle)}.zip`);
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ unit: "px", format: [1080, 1080], orientation: "portrait" });
        for (let i = 0; i < slides.length; i++) {
          if (i > 0) pdf.addPage([1080, 1080], "portrait");
          const dataUrl = await imageUrlToDataUrl(slides[i]);
          pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1080);
        }
        const out = pdf.output("blob");
        triggerDownload(out, `${slug(carouselTitle)}.pdf`);
      }
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold"
      >
        <Download className="size-4" />
        Export
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => void handleExport("zip")}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50"
            >
              Download PNG ZIP
              <span className="block text-[11px] text-zinc-500">
                All slides bundled as .zip
              </span>
            </button>
            <button
              type="button"
              onClick={() => void handleExport("pdf")}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 border-t border-zinc-100"
            >
              Download PDF
              <span className="block text-[11px] text-zinc-500">
                One page per slide at 1080×1080
              </span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load slide");
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "carousel";
}

// ============================================================
// F7 — Live preview panel (right column).
// Shows rendered slides when available, otherwise a styled mock
// derived from the script + style. Debounced via React state.
// ============================================================
function LivePreviewPanel({
  script,
  style,
  renderedSlides,
}: {
  script: CarouselScript | null;
  style: CarouselStyle;
  renderedSlides: JobPollResponse["slides"] | undefined;
}) {
  if (!script || script.slides.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center text-xs text-zinc-500">
        <ImageIcon className="mx-auto mb-2 size-5 text-zinc-400" />
        Your slides will appear here as soon as you generate a script.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 max-h-[640px] overflow-y-auto pr-1">
      {script.slides.map((slide) => {
        const rendered = renderedSlides?.find((r) => r.index === slide.index);
        return (
          <PreviewSlideTile
            key={slide.index}
            slide={slide}
            style={style}
            renderedUrl={rendered?.assetUrl}
            total={script.slides.length}
          />
        );
      })}
    </div>
  );
}

function PreviewSlideTile({
  slide,
  style,
  renderedUrl,
  total,
}: {
  slide: CarouselSlideScript;
  style: CarouselStyle;
  renderedUrl?: string;
  total: number;
}) {
  const displayFont = `"${style.fonts.display}", "Helvetica Neue", Arial, sans-serif`;
  const bodyFont = `"${style.fonts.body}", "Helvetica Neue", Arial, sans-serif`;
  const bgOpacity = (slide.backgroundOpacity ?? 0) / 100;
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
      {/* Background image (F6) — clipped to the card */}
      {slide.backgroundUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.backgroundUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: style.colors.background, opacity: 1 - bgOpacity }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: style.colors.background }}
          aria-hidden
        />
      )}
      {/* Rendered image (if available) — covers the tile */}
      {renderedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={renderedUrl}
          alt={`Slide ${slide.index + 1}`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="relative size-full p-3 flex flex-col justify-center text-center">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: style.colors.accent, fontFamily: displayFont }}
          >
            Slide {slide.index + 1} / {total}
          </span>
          <p
            className="mt-1 text-sm font-extrabold leading-tight"
            style={{ color: style.colors.primary, fontFamily: displayFont }}
          >
            {slide.headline || "…"}
          </p>
          {slide.body ? (
            <p
              className="mt-1 text-[10px] leading-snug"
              style={{
                color: style.colors.primary,
                fontFamily: bodyFont,
                opacity: 0.75,
              }}
            >
              {slide.body}
            </p>
          ) : null}
        </div>
      )}
      <span className="pointer-events-none absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
        {slide.index + 1}
      </span>
    </div>
  );
}

// ============================================================
// F7 — Full Preview modal (1:1 with left/right navigation)
// ============================================================
function FullPreviewModal({
  open,
  slides,
  style,
  renderedSlides,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  slides: CarouselSlideScript[];
  style: CarouselStyle;
  renderedSlides: JobPollResponse["slides"] | undefined;
  index: number;
  onIndexChange: (n: number) => void;
  onClose: () => void;
}) {
  const slide = slides[index];
  const rendered = renderedSlides?.find((r) => r.index === index);
  if (!slide) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium hover:bg-zinc-100"
      >
        <X className="size-3.5" /> Close
      </button>
      <div
        className="relative max-h-[85vh] w-[min(420px,90vw)]"
        onClick={(e) => e.stopPropagation()}
      >
        <PreviewSlideTile
          slide={slide}
          style={style}
          renderedUrl={rendered?.assetUrl}
          total={slides.length}
        />
      </div>
      <div className="mt-3 flex items-center gap-3 text-white text-xs">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onIndexChange(index - 1)}
          className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" /> Prev
        </button>
        <span>
          Slide {index + 1} of {slides.length}
        </span>
        <button
          type="button"
          disabled={index === slides.length - 1}
          onClick={() => onIndexChange(index + 1)}
          className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium hover:bg-white/20 disabled:opacity-30"
        >
          Next <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// F6 — Per-slide background picker modal.
// ============================================================
function BackgroundPickerModal({
  open,
  onClose,
  onPick,
  initialOpacity,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  initialOpacity: number;
}) {
  const [tab, setTab] = useState<"unsplash" | "library" | "upload">("unsplash");
  const [opacity, setOpacity] = useState(initialOpacity);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<
    Array<{ id: string; url: string; name?: string }>
  >([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  useEffect(() => {
    if (!open || tab !== "library") return;
    setLoadingLibrary(true);
    void fetch("/api/media/list?pageSize=24", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        const data = (await r.json()) as {
          assets?: Array<{ id: string; url: string; mime: string }>;
        };
        setLibraryItems(
          (data.assets ?? [])
            .filter((a) => a.mime.startsWith("image/"))
            .map((i) => ({ id: i.id, url: i.url, name: i.id }))
        );
      })
      .catch(() => setLibraryItems([]))
      .finally(() => setLoadingLibrary(false));
  }, [open, tab]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">Set background image</h3>
            <p className="text-xs text-zinc-500">
              Pick an image for this slide. Adjust opacity below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
          {(["unsplash", "library", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-sm px-3 py-1 font-medium " +
                (tab === t
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900")
              }
            >
              {t === "unsplash" ? "Unsplash" : t === "library" ? "Media Library" : "Upload"}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[180px]">
          {tab === "unsplash" ? (
            <button
              type="button"
              onClick={() => setUnsplashOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
            >
              Search Unsplash
            </button>
          ) : tab === "library" ? (
            loadingLibrary ? (
              <p className="text-xs text-zinc-500 inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading library…
              </p>
            ) : libraryItems.length === 0 ? (
              <p className="text-xs text-zinc-500">No media yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {libraryItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onPick(it.url)}
                    className="aspect-square overflow-hidden rounded-md border border-zinc-200 hover:border-zinc-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.name ?? ""} className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5_000_000) {
                    showToast({ tone: "error", title: "Image too large (max 5MB)" });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const url = String(reader.result);
                    onPick(url);
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full cursor-pointer rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs file:me-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1 file:text-white"
              />
              <span className="mt-1 block text-[11px] text-zinc-500">
                Max 5MB · PNG / JPEG / WEBP
              </span>
            </label>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-700">
            Background opacity: {opacity}%
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <p className="mt-1 text-[11px] text-zinc-500">
            Lower opacity keeps the brand background colour visible behind the image so text stays readable.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // Persist the new opacity by re-emitting a dummy URL if
              // the user picked one. The wizard stores backgroundOpacity
              // alongside the URL. If no URL yet, just close.
              onClose();
            }}
            className="inline-flex items-center rounded-md bg-zinc-900 px-3 h-9 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>

      <UnsplashDialog
        open={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onImport={(files) => {
          const first = files[0];
          if (first) onPick(first.url);
          setUnsplashOpen(false);
        }}
      />
    </div>
  );
}
