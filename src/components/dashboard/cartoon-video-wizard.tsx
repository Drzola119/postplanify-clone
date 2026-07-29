"use client";
/**
 * cartoon-video-wizard.tsx
 * Multi-step wizard for the Cartoon-Style Video workflow.
 * Mirrors infographic-wizard.tsx step pattern; final step is async polling.
 *
 * Steps:
 *   1. Choose style (sub-style card grid)
 *   2. Enter topic + optional dialogue line OR upload source image
 *   3. Pick duration + aspect ratio(s)
 *   4. Generate + poll (progress view with status updates)
 *   5. Result (video player + download/schedule actions)
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import type { CartoonSubStyle } from "@/lib/video-gen/workflows/cartoon";
import type { VideoAspectRatio } from "@/lib/video-gen/types";

type Step = "style" | "content" | "settings" | "generating" | "result";

const SUBSTYLES: { id: CartoonSubStyle; label: string; emoji: string; description: string }[] = [
  { id: "pixar-3d", label: "3D Pixar-Style", emoji: "🎬", description: "Cinematic 3D animation" },
  { id: "flat-2d", label: "Flat 2D", emoji: "🎨", description: "Clean vector motion-graphics" },
  { id: "anime", label: "Anime", emoji: "✨", description: "Japanese animation style" },
  { id: "saturday-morning", label: "Saturday Morning", emoji: "📺", description: "Retro 80s cartoon" },
];

const DURATIONS: { label: string; value: 5 | 8 | 10 | 15 }[] = [
  { label: "5s", value: 5 },
  { label: "8s", value: 8 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
];

const ASPECT_RATIOS: { label: string; value: VideoAspectRatio; icon: string }[] = [
  { label: "9:16", value: "9:16", icon: "📱" },
  { label: "1:1", value: "1:1", icon: "□" },
  { label: "16:9", value: "16:9", icon: "🖥️" },
];

type JobStatus = "queued" | "generating_clips" | "composing" | "complete" | "failed";

interface PollResponse {
  jobId: string;
  status: JobStatus;
  finalAssets?: Array<{ aspectRatio: string; assetId: string; assetUrl: string }>;
  error?: string | null;
}

export function CartoonVideoWizard() {
  const t = useTranslations("videos");

  const [step, setStep] = useState<Step>("style");
  const [subStyle, setSubStyle] = useState<CartoonSubStyle>("pixar-3d");
  const [topic, setTopic] = useState("");
  const [dialogueLine, setDialogueLine] = useState("");
  const [durationSec, setDurationSec] = useState<5 | 8 | 10 | 15>(8);
  const [aspectRatios, setAspectRatios] = useState<VideoAspectRatio[]>(["16:9"]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [finalAssets, setFinalAssets] = useState<PollResponse["finalAssets"]>([]);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─ Step 3: toggle aspect ratio selection ─────────────────────────────────
  function toggleAspectRatio(ar: VideoAspectRatio) {
    setAspectRatios((prev) =>
      prev.includes(ar)
        ? prev.length > 1
          ? prev.filter((x) => x !== ar)
          : prev // keep at least one
        : prev.length < 3
        ? [...prev, ar]
        : prev // max 3
    );
  }

  // ─ Submit ─────────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    setIsSubmitting(true);
    setStep("generating");

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
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.jobId);
      setJobStatus("queued");
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Something went wrong");
      setJobStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─ Poll for job status ──────────────────────────────────────────────────────
  const pollJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/videos/${jobId}`);
      if (!res.ok) return;
      const data: PollResponse = await res.json();
      setJobStatus(data.status);

      if (data.status === "complete") {
        setFinalAssets(data.finalAssets ?? []);
        setStep("result");
      } else if (data.status === "failed") {
        setJobError(data.error ?? "Generation failed");
      }
    } catch {
      // silent — next tick will retry
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || jobStatus === "complete" || jobStatus === "failed") return;
    const interval = setInterval(pollJob, 5_000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, pollJob]);

  // ─ Render ──────────────────────────────────────────────────────────────────────

  if (step === "style") {
    return (
      <div className="space-y-6">
        <StepHeader step={1} total={3} label={t("cartoon.step_style")} />
        <div className="grid grid-cols-2 gap-3">
          {SUBSTYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubStyle(s.id)}
              className={`flex flex-col gap-1 rounded-xl border-2 p-4 text-start transition-all
                ${subStyle === s.id ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:border-muted-foreground"}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="font-medium text-sm">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.description}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setStep("content")}>
            {t("wizard.next")} <ChevronRight className="ms-1 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "content") {
    return (
      <div className="space-y-6">
        <StepHeader step={2} total={3} label={t("cartoon.step_content")} />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("cartoon.topic_label")}
            </label>
            <Textarea
              placeholder={t("cartoon.topic_placeholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("cartoon.dialogue_label")}
              <span className="ms-1 text-xs text-muted-foreground">({t("wizard.optional")})</span>
            </label>
            <Input
              placeholder={t("cartoon.dialogue_placeholder")}
              value={dialogueLine}
              onChange={(e) => setDialogueLine(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("style")}>
            <ChevronLeft className="me-1 size-4" /> {t("wizard.back")}
          </Button>
          <Button onClick={() => setStep("settings")} disabled={!topic.trim()}>
            {t("wizard.next")} <ChevronRight className="ms-1 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "settings") {
    return (
      <div className="space-y-6">
        <StepHeader step={3} total={3} label={t("cartoon.step_settings")} />

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium">{t("cartoon.duration_label")}</label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDurationSec(d.value)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all
                  ${durationSec === d.value ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" : "border-border hover:border-muted-foreground"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect ratios */}
        <div>
          <label className="mb-2 block text-sm font-medium">{t("cartoon.aspect_ratio_label")}</label>
          <p className="mb-3 text-xs text-muted-foreground">{t("cartoon.aspect_ratio_hint")}</p>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => toggleAspectRatio(ar.value)}
                className={`flex items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all
                  ${aspectRatios.includes(ar.value) ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" : "border-border hover:border-muted-foreground"}`}
              >
                <span>{ar.icon}</span> {ar.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("content")}>
            <ChevronLeft className="me-1 size-4" /> {t("wizard.back")}
          </Button>
          <Button onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="me-2 size-4" />
            )}
            {t("wizard.generate")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        {jobStatus === "failed" ? (
          <>
            <XCircle className="size-14 text-destructive" />
            <h2 className="text-lg font-semibold">{t("wizard.generation_failed")}</h2>
            <p className="text-sm text-muted-foreground">{jobError}</p>
            <Button onClick={() => { setStep("settings"); setJobId(null); setJobStatus(null); setJobError(null); }}>
              {t("wizard.try_again")}
            </Button>
          </>
        ) : (
          <>
            <div className="relative">
              <Loader2 className="size-14 animate-spin text-violet-500" />
            </div>
            <h2 className="text-lg font-semibold">
              {jobStatus === "queued" && t("wizard.status_queued")}
              {jobStatus === "generating_clips" && t("wizard.status_generating")}
              {jobStatus === "composing" && t("wizard.status_composing")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("wizard.generation_hint")}</p>
          </>
        )}
      </div>
    );
  }

  // step === "result"
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-6 text-emerald-500" />
        <h2 className="text-lg font-semibold">{t("wizard.done")}</h2>
      </div>

      {finalAssets && finalAssets.length > 0 && (
        <div className="grid gap-4">
          {finalAssets.map((asset) => (
            <div key={asset.assetId} className="space-y-2">
              <Badge variant="outline">{asset.aspectRatio}</Badge>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={asset.assetUrl}
                controls
                className="w-full rounded-xl border bg-black"
              />
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={asset.assetUrl} download target="_blank" rel="noopener noreferrer">
                    {t("wizard.download")}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => {
          setStep("style");
          setJobId(null);
          setJobStatus(null);
          setFinalAssets([]);
          setJobError(null);
          setTopic("");
          setDialogueLine("");
        }}
      >
        {t("wizard.make_another")}
      </Button>
    </div>
  );
}

function StepHeader({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Step {step} of {total}
      </p>
      <h2 className="text-xl font-semibold">{label}</h2>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-violet-500 transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
