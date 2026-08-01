"use client";

/**
 * real-estate-wizard.tsx
 *
 * Real Estate Video Studio wizard — mirror of whiteboard-wizard.tsx.
 * Two input modes (AI-Generated Property / My Listing Photos), one
 * shared Stage 2 (keyframe-to-video clips). Defaults to "my-photos"
 * because that's what real listing agents actually want most of the
 * time (per spec §2.4).
 *
 * Layout: numbered Panels on the left, sticky live preview on the right.
 * State held client-side; polls /api/videos/[jobId] every 5s while a
 * job is active. Phase 1 (ai-generated mode) shows each shot thumbnail
 * appearing as the image-plan-runner completes it — much more concrete
 * than a spinner.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Building2,
  Camera,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, Field, Meta } from "@/components/dashboard/wizard-kit";

type Mode = "ai-generated" | "my-photos";
type Language = "fr" | "en" | "ar";
type AspectRatio = "16:9" | "9:16" | "1:1";
type CameraDirection =
  | "forward"
  | "backward"
  | "turn-left"
  | "turn-right"
  | "tilt-up"
  | "tilt-down";

interface PropertyShot {
  index: number;
  roomLabel: string;
  imagePrompt?: string;
  referenceShotIndexes?: number[];
  imageUrl?: string;
  status: "pending" | "generating" | "complete" | "failed";
}

interface PropertyTransition {
  index: number;
  fromShotIndex: number;
  toShotIndex: number;
  cameraDirection: CameraDirection;
  voiceoverLine?: string;
  status: "pending" | "generating" | "complete" | "failed";
  assetUrl?: string;
  assetId?: string;
}

interface ShotPlan {
  mode: Mode;
  styleId: string;
  shots: PropertyShot[];
  transitions: PropertyTransition[];
  language?: Language;
}

interface UploadedPhoto {
  id: string;
  url: string;
}

type JobStatus =
  | "queued"
  | "scripting"
  | "generating_images"
  | "generating_clips"
  | "waiting_compose"
  | "composing"
  | "complete"
  | "failed";

interface PollResponse {
  jobId: string;
  status: JobStatus;
  shots?: PropertyShot[];
  transitions?: PropertyTransition[];
  finalAssets?: { aspectRatio: string; assetUrl: string; assetId: string }[];
  totalCostUsd?: number;
  error?: string | null;
}

interface RealEstateWizardProps {
  title: string;
  subtitle: string;
}

const STYLE_PRESETS: Array<{ id: string; label: string; blurb: string }> = [
  { id: "modern-american-luxury", label: "Modern American Luxury", blurb: "Bright daylight, walnut + glass." },
  { id: "cozy-farmhouse", label: "Cozy Farmhouse", blurb: "Warm wood, muted earth palette." },
  { id: "urban-industrial-loft", label: "Urban Industrial Loft", blurb: "Concrete, brick, moody." },
  { id: "mediterranean-villa", label: "Mediterranean Villa", blurb: "Stucco arches, terracotta." },
];

const LANGUAGES: Array<{ id: Language; label: string; note?: string }> = [
  { id: "fr", label: "Français", note: "Recommended for premium listings" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية (MSA)", note: "Reads as formal Arabic" },
];

const ASPECT_RATIOS: Array<{ id: AspectRatio; label: string }> = [
  { id: "16:9", label: "16:9 — YouTube / web" },
  { id: "9:16", label: "9:16 — Stories / Reels" },
  { id: "1:1", label: "1:1 — Square" },
];

const SHOT_COUNT_OPTIONS = [5, 8, 10] as const;

const CAMERA_OPTIONS: Array<{ id: CameraDirection; label: string }> = [
  { id: "forward", label: "Forward" },
  { id: "backward", label: "Backward" },
  { id: "turn-left", label: "Turn left" },
  { id: "turn-right", label: "Turn right" },
  { id: "tilt-up", label: "Tilt up" },
  { id: "tilt-down", label: "Tilt down" },
];

export function RealEstateWizard({ title, subtitle }: RealEstateWizardProps) {
  const t = useTranslations("videos");
  const tw = useTranslations("videos.wizard");

  // Form state
  const [mode, setMode] = useState<Mode>("my-photos");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [styleId, setStyleId] = useState<string>("modern-american-luxury");
  const [shotCount, setShotCount] = useState<number>(10);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [provider, setProvider] = useState<"seedance-2-fast" | "seedance-2">("seedance-2-fast");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [language, setLanguage] = useState<Language>("fr");
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");

  // Job state
  const [plan, setPlan] = useState<ShotPlan | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [finalAssets, setFinalAssets] = useState<{ aspectRatio: string; assetUrl: string; assetId: string }[]>([]);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cost estimate — naive, surface it as a hint not a guarantee.
  const estimatedCostUsd = useMemo(() => {
    const shotN = mode === "ai-generated" ? shotCount : Math.max(photos.length, 2);
    const transitionsN = shotN - 1;
    const perClip = provider === "seedance-2-fast" ? 0.04 : 0.06;
    const imagePerShot = 0.002;
    const imageCost = mode === "ai-generated" ? shotN * imagePerShot : 0;
    return Math.round((imageCost + transitionsN * perClip) * 100) / 100;
  }, [mode, shotCount, photos.length, provider]);

  const canPreview =
    !isPreviewing &&
    ((mode === "ai-generated" && propertyDescription.trim().length >= 10) ||
      (mode === "my-photos" && photos.length >= 2));

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: UploadedPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const url = URL.createObjectURL(file);
      next.push({ id: `${Date.now()}-${i}-${file.name}`, url });
    }
    setPhotos((prev) => [...prev, ...next].slice(0, 12));
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function movePhoto(id: string, delta: number) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const nextIdx = Math.max(0, Math.min(prev.length - 1, idx + delta));
      if (nextIdx === idx) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  }

  async function handlePreview() {
    if (!canPreview) return;
    setIsPreviewing(true);
    setJobError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/videos/real-estate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "real-estate",
          provider,
          styleId: mode === "ai-generated" ? styleId : "user-photos",
          aspectRatios: [aspectRatio],
          mode,
          propertyDescription: mode === "ai-generated" ? propertyDescription.trim() : undefined,
          shotCount: mode === "ai-generated" ? shotCount : undefined,
          language,
          headline: headline.trim() || undefined,
          price: price.trim() || undefined,
          address: address.trim() || undefined,
          photoAssetIds: mode === "my-photos" ? photos.map((p) => p.id) : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        plan: ShotPlan;
      };
      // For my-photos, imageUrl is a blob: URL — not portable. Strip it;
      // the job doc on commit will re-derive from mediaAssets.
      const sanitized: ShotPlan = {
        ...data.plan,
        shots: data.plan.shots.map((s) => ({
          ...s,
          imageUrl: undefined,
        })),
      };
      setPlan(sanitized);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleCommit() {
    if (!plan) return;
    setIsCommitting(true);
    setJobError(null);
    try {
      const res = await fetch("/api/videos/real-estate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base: {
            workflow: "real-estate",
            provider,
            styleId: mode === "ai-generated" ? styleId : "user-photos",
            aspectRatios: [aspectRatio],
            mode,
            propertyDescription: mode === "ai-generated" ? propertyDescription.trim() : undefined,
            shotCount: mode === "ai-generated" ? shotCount : undefined,
            language,
            headline: headline.trim() || undefined,
            price: price.trim() || undefined,
            address: address.trim() || undefined,
            photoAssetIds: mode === "my-photos" ? photos.map((p) => p.id) : undefined,
          },
          plan: {
            shots: plan.shots.map((s) => ({
              index: s.index,
              roomLabel: s.roomLabel,
              referenceShotIndexes: s.referenceShotIndexes ?? [],
            })),
            transitions: plan.transitions.map((tr) => ({
              index: tr.index,
              fromShotIndex: tr.fromShotIndex,
              toShotIndex: tr.toShotIndex,
              cameraDirection: tr.cameraDirection,
              voiceoverLine: tr.voiceoverLine,
            })),
          },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { jobId: string; shotPlan: ShotPlan };
      setJobId(data.jobId);
      setJobStatus("queued");
      setPlan(data.shotPlan);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setIsCommitting(false);
    }
  }

  async function handleRegenerateTransition(idx: number) {
    if (!jobId) return;
    try {
      setJobError(null);
      const res = await fetch(
        `/api/videos/real-estate/${jobId}/transitions/${idx}/regenerate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Regenerate failed");
    }
  }

  const pollJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/videos/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as PollResponse;
      setJobStatus(data.status);
      if (data.shots && plan) setPlan((p) => (p ? { ...p, shots: data.shots! } : p));
      if (data.transitions && plan) setPlan((p) => (p ? { ...p, transitions: data.transitions! } : p));
      if (data.status === "complete") {
        setFinalAssets(data.finalAssets ?? []);
      } else if (data.status === "failed") {
        setJobError(data.error ?? "Generation failed");
      }
    } catch {
      /* next tick */
    }
  }, [jobId, plan]);

  useEffect(() => {
    if (!jobId || jobStatus === "complete" || jobStatus === "failed") return;
    const interval = setInterval(pollJob, 5_000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, pollJob]);

  function reset() {
    setJobId(null);
    setJobStatus(null);
    setPlan(null);
    setFinalAssets([]);
    setJobError(null);
    setPropertyDescription("");
    setHeadline("");
    setPrice("");
    setAddress("");
  }

  const isRendering =
    jobStatus !== null &&
    jobStatus !== "complete" &&
    jobStatus !== "failed";

  const hasResult = jobStatus === "complete" && finalAssets.length > 0;
  const hasFailed = jobStatus === "failed";
  const hasPlan = plan !== null;

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
        <div className="space-y-6">
          {/* Step 1 — Mode */}
          <Panel step="1" title="Input mode">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("my-photos")}
                className={
                  "text-start rounded-xl border p-3 transition-all " +
                  (mode === "my-photos"
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300")
                }
              >
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-zinc-700" />
                  <p className="text-sm font-semibold">My listing photos</p>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Upload 2–12 photos. Recommended for real listings — ~40% cheaper, no AI drift.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode("ai-generated")}
                className={
                  "text-start rounded-xl border p-3 transition-all " +
                  (mode === "ai-generated"
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300")
                }
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-zinc-700" />
                  <p className="text-sm font-semibold">AI-generated property</p>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Describe a fictional property. Generates 5–10 reference-chained photos.
                </p>
              </button>
            </div>
          </Panel>

          {/* Step 2 — Input */}
          {mode === "ai-generated" ? (
            <Panel step="2" title="Property">
              <Field label="Property description">
                <textarea
                  value={propertyDescription}
                  onChange={(e) =>
                    setPropertyDescription(e.target.value.slice(0, 600))
                  }
                  placeholder="e.g. Modern 4-bed American luxury villa in Miami with white stucco, walnut accents, open-plan kitchen, pool, tropical landscaping."
                  rows={4}
                  maxLength={600}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <p className="mt-1 text-[11px] text-zinc-500 text-end">
                  {propertyDescription.length}/600
                </p>
              </Field>
              <Field label="Style preset">
                <div className="grid gap-2 sm:grid-cols-2">
                  {STYLE_PRESETS.map((s) => {
                    const active = styleId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyleId(s.id)}
                        className={
                          "text-start rounded-xl border p-3 transition-all " +
                          (active
                            ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                            : "border-zinc-200 bg-white hover:border-zinc-300")
                        }
                      >
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-600">{s.blurb}</p>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Number of shots">
                <div className="flex flex-wrap gap-2">
                  {SHOT_COUNT_OPTIONS.map((n) => {
                    const active = shotCount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setShotCount(n)}
                        className={
                          "rounded-md border px-4 h-9 text-sm font-medium transition-all " +
                          (active
                            ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 bg-white hover:border-zinc-300")
                        }
                      >
                        {n} shots
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  More shots = a longer, smoother walkthrough. 10 is the curated default.
                </p>
              </Field>
            </Panel>
          ) : (
            <Panel
              step="2"
              title="Listing photos"
              subtitle="Upload 2–12 photos. Drag to reorder — this is the route the walkthrough follows."
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 p-6 text-center text-sm text-zinc-600"
              >
                <ImageIcon className="mx-auto size-5 mb-1.5 text-zinc-400" />
                Click to upload photos
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  PNG / JPG, up to 12 photos
                </span>
              </button>
              {photos.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2"
                    >
                      <img
                        src={p.url}
                        alt={`Photo ${idx + 1}`}
                        className="size-12 rounded object-cover bg-zinc-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {idx + 1}. Photo {idx + 1}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">{p.id.slice(-8)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePhoto(p.id, -1)}
                          disabled={idx === 0}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-zinc-200 text-xs disabled:opacity-30"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhoto(p.id, 1)}
                          disabled={idx === photos.length - 1}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-zinc-200 text-xs disabled:opacity-30"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-red-200 text-xs text-red-700 hover:bg-red-50"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Panel>
          )}

          {/* Step 3 — Format */}
          <Panel step="3" title="Format">
            <Field label="Aspect ratio">
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ar) => {
                  const active = aspectRatio === ar.id;
                  return (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
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
            <Field label="Language">
              <div className="grid gap-1.5">
                {LANGUAGES.map((l) => {
                  const active = language === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={
                        "text-start rounded-md border px-3 py-2 transition-all " +
                        (active
                          ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      <span className="text-sm font-medium">{l.label}</span>
                      {l.note ? (
                        <span className="ms-2 text-[11px] text-zinc-500">{l.note}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Field>
            <p className="text-[11px] text-zinc-500 -mt-1">
              Narration voice may vary slightly between scenes.
            </p>
            <Field
              label={
                <span>
                  Captions
                  <span className="ms-1 text-xs text-zinc-500 font-normal">
                    (optional — burned in as lower-third)
                  </span>
                </span>
              }
            >
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, 200))}
                placeholder="Listing headline (e.g. Modern 4-bed villa with pool)"
                maxLength={200}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.slice(0, 80))}
                  placeholder="Price (e.g. $1,250,000)"
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.slice(0, 200))}
                  placeholder="Address (e.g. 142 Ocean Dr, Miami)"
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </Field>
            <Field label="Video model">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: "seedance-2-fast" as const, label: "Seedance 2 Fast", blurb: "Fastest & cheapest", cost: "~$0.04/clip" },
                  { id: "seedance-2" as const, label: "Seedance 2 Standard", blurb: "Balanced quality", cost: "~$0.06/clip" },
                ].map((p) => {
                  const active = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={
                        "text-start rounded-xl border p-3 transition-all " +
                        (active
                          ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-[11px] text-zinc-600">{p.blurb}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 font-mono">{p.cost}</p>
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
              <span className="font-semibold">Estimated cost:</span>{" "}
              <span className="font-mono">~${estimatedCostUsd.toFixed(2)}</span>
              {mode === "my-photos" ? (
                <span className="ms-2 text-zinc-500">
                  (using your photos costs ~40% less — no AI image generation)
                </span>
              ) : null}
            </div>
          </Panel>

          {/* Step 4 — Shot plan preview */}
          <Panel
            step="4"
            title="Shot plan"
            subtitle="Review the walkthrough sequence before committing."
          >
            {!hasPlan ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <p className="text-sm text-zinc-600">
                  Fill in the inputs above, then click <strong>Preview shot plan</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
                  <span className="font-semibold">{plan.shots.length} shots</span>
                  {" · "}
                  <span className="font-semibold">{plan.transitions.length} transitions</span>
                  {" · "}
                  <span className="font-mono">{aspectRatio}</span>
                  {" · "}
                  <span>{LANGUAGES.find((l) => l.id === language)?.label}</span>
                </div>

                {/* Shot thumbnails — imageUrl streams in as image-plan-runner completes */}
                {mode === "ai-generated" ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {plan.shots.map((s) => (
                      <div
                        key={s.index}
                        className="rounded-lg border border-zinc-200 bg-white overflow-hidden"
                      >
                        <div className="aspect-video bg-zinc-100 grid place-items-center text-zinc-400 text-xs">
                          {s.imageUrl ? (
                            <img
                              src={s.imageUrl}
                              alt={s.roomLabel}
                              className="size-full object-cover"
                            />
                          ) : s.status === "generating" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : s.status === "failed" ? (
                            <AlertCircle className="size-4 text-red-500" />
                          ) : (
                            <span className="text-[10px] font-mono">{s.index + 1}</span>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-semibold truncate">
                            {s.index + 1}. {s.roomLabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Transition list with camera direction override */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-zinc-700">Transitions</p>
                  {plan.transitions.map((tr) => (
                    <div
                      key={tr.index}
                      className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5"
                    >
                      <span className="text-[10px] font-mono text-zinc-500 w-6 text-end">
                        {tr.index + 1}
                      </span>
                      <span className="text-xs text-zinc-700 truncate flex-1 min-w-0">
                        {plan.shots[tr.fromShotIndex]?.roomLabel ?? "?"} →{" "}
                        {plan.shots[tr.toShotIndex]?.roomLabel ?? "?"}
                      </span>
                      <select
                        value={tr.cameraDirection}
                        onChange={(e) =>
                          setPlan((p) =>
                            p
                              ? {
                                  ...p,
                                  transitions: p.transitions.map((t) =>
                                    t.index === tr.index
                                      ? { ...t, cameraDirection: e.target.value as CameraDirection }
                                      : t
                                  ),
                                }
                              : p
                          )
                        }
                        className="h-7 px-2 rounded-md border border-zinc-200 bg-white text-[11px]"
                      >
                        {CAMERA_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {tr.status === "complete" && jobId ? (
                        <button
                          type="button"
                          onClick={() => handleRegenerateTransition(tr.index)}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-zinc-200 text-[10px] hover:bg-zinc-50"
                          aria-label="Regenerate this transition"
                          title="Regenerate this transition"
                        >
                          ↻
                        </button>
                      ) : tr.status === "complete" ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : tr.status === "failed" ? (
                        <AlertCircle className="size-3.5 text-red-500" />
                      ) : tr.status === "generating" ? (
                        <Loader2 className="size-3.5 animate-spin text-zinc-500" />
                      ) : null}
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

          <div className="flex items-center justify-end gap-2">
            {!hasPlan ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={!canPreview}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                Preview shot plan
              </button>
            ) : jobId ? (
              <button
                type="button"
                disabled={isRendering}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-200 text-zinc-700 text-sm font-semibold cursor-default"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Rendering…
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    {jobStatus === "complete" ? "Complete" : "In progress"}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCommit}
                disabled={isCommitting}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isCommitting ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                Generate walkthrough video
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
              className={
                "mt-3 w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center " +
                (aspectRatio === "9:16"
                  ? "aspect-[9/16] max-w-[260px] mx-auto"
                  : aspectRatio === "1:1"
                    ? "aspect-square"
                    : "aspect-video")
              }
            >
              {hasResult && finalAssets[0] ? (
                <video
                  src={finalAssets[0].assetUrl}
                  controls
                  className="size-full object-contain bg-black"
                />
              ) : isRendering ? (
                <div className="flex flex-col items-center gap-3 text-zinc-500 p-4">
                  <Loader2 className="size-5 animate-spin" />
                  <ol className="space-y-1 text-xs text-center">
                    {[
                      { key: "queued", label: "Job queued" },
                      { key: "generating_images", label: "Generating photos", aiOnly: mode === "ai-generated" },
                      { key: "generating_clips", label: "Generating transitions" },
                      { key: "waiting_compose", label: "All transitions ready" },
                      { key: "composing", label: "Merging" },
                      { key: "complete", label: "Complete" },
                    ]
                      .filter((s) => s.key !== "generating_images" || s.aiOnly)
                      .map((s, idx, arr) => {
                        const order: JobStatus[] = [
                          "queued",
                          "generating_images",
                          "generating_clips",
                          "waiting_compose",
                          "composing",
                          "complete",
                        ];
                        // isRendering branch already excludes "failed"; this
                        // runs only while the job is in progress.
                        const cur = jobStatus ? order.indexOf(jobStatus) : -1;
                        const done = cur >= idx;
                        return (
                          <li
                            key={s.key}
                            className={"flex items-center justify-center gap-1.5 " + (done ? "text-emerald-700" : "")}
                          >
                            {done ? <Check className="size-3" /> : <span className="inline-block size-2 rounded-full bg-zinc-300" />}
                            {s.label}
                          </li>
                        );
                      })}
                  </ol>
                </div>
              ) : hasFailed ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <AlertCircle className="size-6" />
                  <p className="text-xs">Generation failed.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <ImageIcon className="size-6" />
                  <p className="text-xs">{mode === "my-photos" ? "Upload photos to begin." : "Describe a property to begin."}</p>
                </div>
              )}
            </div>

            {hasResult ? (
              <div className="mt-4 space-y-3">
                <Meta label="Shots" value={String(plan?.shots.length ?? 0)} />
                <Meta label="Transitions" value={String(plan?.transitions.length ?? 0)} />
                <Meta label="Ratio" value={aspectRatio} />
                <Meta label="Language" value={LANGUAGES.find((l) => l.id === language)?.label ?? language} />
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
                      Download
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
              <strong>My photos:</strong> your photos become the walkthrough stops; the model interpolates between them.
            </p>
            <p>
              <strong>AI-generated:</strong> Nano Banana generates each shot, anchoring on the prior shot to keep the
              house identity stable.
            </p>
            <p className="flex items-start gap-1.5 pt-1">
              <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
              <span>You can leave this page — processing continues server-side.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
