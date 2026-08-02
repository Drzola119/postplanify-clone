/**
 * carousel-gen/workflow.ts
 *
 * Reference-chained carousel slide generation. Slide 0 (Hook) generates
 * standalone; slides 1-4 each pass slide 0's asset URL as a reference so
 * the chain stays visually consistent. Every prompt is wrapped with the
 * style-lock block (spec §4) so the chain holds even though GPT-Image-2
 * ignores the reference image silently today — the words in the prompt
 * are what actually keep the slides coherent.
 *
 * Two entry points:
 *   - runCarouselWorkflow(): generates all 5 slides, updating the job doc
 *     in Firestore as each one completes. Used by the worker that picks
 *     up a queued job.
 *   - regenerateOneSlide(): re-runs a single slide against the same
 *     style-lock + reference chain. Used by the per-slide regenerate
 *     endpoint.
 *
 * Mirrors `video-gen/workflows/real-estate.ts`'s "sequential image-plan
 * runner + per-transition regenerate" pattern, trimmed to image-only.
 */

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { generateInfographic, ImageGenExhaustedError } from "@/lib/image-gen";
import { PROVIDER_IDS, type ProviderId } from "@/lib/image-gen/types";
import { buildStyleLockPrompt, buildRegeneratePrompt } from "./prompt-builder";
import { getCarouselStyle } from "./styles";
import { runVisionQaPass } from "./vision-qa";
import type {
  CarouselJobDoc,
  CarouselJobSlideRecord,
  CarouselScript,
  CarouselStyle,
  SlideType,
} from "./types";
import { SLIDE_ORDER } from "./types";
import { createLogger } from "@/lib/log";

const logger = createLogger("carousel-gen:workflow");

/** Retries per slide — generation can flake on transient provider hiccups. */
const MAX_SLIDE_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RunCarouselArgs {
  /** Workspace id (for usage counter + cost logging). */
  workspaceId: string;
  /** User id (for asset tagging + ownership). */
  uid: string;
  /** Resolved style id. */
  styleId: string;
  /** The committed script (post-edit, post-preview). */
  script: CarouselScript;
  /**
   * Firestore document reference for the carouselJobs doc. The workflow
   * patches each slide's status in-place as it completes, so the wizard
   * can poll for live progress.
   */
  jobRef: FirebaseFirestore.DocumentReference;
  /** Request headers — passed through for bunny-config resolution. */
  headers?: Headers;
}

export interface RunCarouselResult {
  totalCostUsd: number;
  slidesSucceeded: number;
  slidesFailed: number;
  /** Map of slide index → final asset URL, populated on success only. */
  assetUrls: Record<number, string>;
}

/**
 * Generate all 5 slides sequentially. Slide 0 has no predecessor; each
 * later slide passes slide 0's URL as a reference (per spec §4 — the
 * FIRST slide is the visual anchor for the rest of the deck).
 *
 * Errors are non-fatal at the workflow level: a single slide failure
 * doesn't abort the whole carousel. The job ends in status "complete"
 * with `hasFailures: true` so the wizard can show which slides need a
 * manual regenerate. Only aborts early if we can't even resolve the
 * style id (programmer error) or persist initial state.
 */
export async function runCarouselWorkflow(args: RunCarouselArgs): Promise<RunCarouselResult> {
  const style = await resolveJobStyle(args.jobRef, args.styleId);

  await args.jobRef.update({
    status: "generating_slides",
    updatedAt: FieldValue.serverTimestamp(),
  });

  let totalCost = 0;
  let succeeded = 0;
  let failed = 0;
  const assetUrls: Record<number, string> = {};

  // Process in SLIDE_ORDER so the order in the job doc matches the
  // skeleton. Reference-chaining: every slide after the Hook passes the
  // Hook's URL as the reference.
  for (const slide of args.script.slides) {
    const slideRecord: CarouselJobSlideRecord = {
      index: slide.index,
      type: slide.type,
      assetUrl: "",
      assetId: "",
      status: "generating",
    };
    await patchSlide(args.jobRef, slide.index, slideRecord);

    const previousAssetUrl = slide.index === 0 ? "" : assetUrls[0] ?? "";
    const prompt = buildStyleLockPrompt({
      style,
      slide,
      previousSlideAssetUrl: previousAssetUrl,
    });

    try {
      const out = await generateOneSlideWithRetries({
        prompt,
        style,
        workspaceId: args.workspaceId,
        uid: args.uid,
        slideIndex: slide.index,
        slideType: slide.type,
        previousAssetUrl,
        headers: args.headers,
      });

      assetUrls[slide.index] = out.assetUrl;
      totalCost += out.costUsd;
      succeeded += 1;

      await patchSlide(args.jobRef, slide.index, {
        status: "complete",
        assetUrl: out.assetUrl,
        assetId: out.assetId,
        provider: out.provider,
        costUsd: out.costUsd,
        width: out.width,
        height: out.height,
      });

      logger.info("Carousel slide complete", {
        jobId: args.jobRef.id,
        index: slide.index,
        type: slide.type,
        provider: out.provider,
        costUsd: out.costUsd,
      });
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      await patchSlide(args.jobRef, slide.index, {
        status: "failed",
        errorMessage: message,
      });
      logger.warn("Carousel slide failed", {
        jobId: args.jobRef.id,
        index: slide.index,
        type: slide.type,
        error: message,
      });
      // Continue to the next slide — one failure doesn't abort the deck.
    }
  }

  const finalStatus = failed === 0 ? "complete" : failed === SLIDE_ORDER.length ? "failed" : "complete";
  await args.jobRef.update({
    status: finalStatus,
    costUsd: round4(totalCost),
    hasFailures: failed > 0,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Fire the M4 vision QA pass in the background if at least the
  // Hook (index 0) and one other slide succeeded. The wizard polls
  // /api/carousels/[jobId] and the `visionQa` field appears when the
  // pass completes. Errors are non-fatal — the wizard just keeps the
  // deck without a verdict.
  const successfulAssets = Object.entries(assetUrls)
    .filter(([idx]) => Number(idx) >= 0)
    .map(([idx, url]) => {
      const slide = args.script.slides.find(
        (s) => s.index === Number(idx)
      );
      return { index: Number(idx), type: slide?.type ?? "unknown", url };
    });
  if (successfulAssets.length >= 2) {
    void runVisionQaPass({
      jobRef: args.jobRef,
      workspaceId: args.workspaceId,
      uid: args.uid,
      assetUrls: successfulAssets,
      headers: args.headers,
    }).catch((err) => {
      logger.warn("Vision QA pass crashed", {
        jobId: args.jobRef.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  return {
    totalCostUsd: round4(totalCost),
    slidesSucceeded: succeeded,
    slidesFailed: failed,
    assetUrls,
  };
}

export interface RegenerateSlideArgs {
  workspaceId: string;
  uid: string;
  styleId: string;
  script: CarouselScript;
  /** Index of the slide to regenerate (0-based). */
  slideIndex: number;
  jobRef: FirebaseFirestore.DocumentReference;
  headers?: Headers;
}

export interface RegenerateSlideResult {
  assetUrl: string;
  assetId: string;
  costUsd: number;
}

/**
 * Regenerate exactly one slide. Used by the per-slide regenerate button
 * in the wizard's review step. Re-runs the same prompt + reference chain
 * (using slide 0's URL as the anchor) so the new image stays consistent
 * with the rest of the deck.
 */
export async function regenerateOneSlide(args: RegenerateSlideArgs): Promise<RegenerateSlideResult> {
  const slide = args.script.slides[args.slideIndex];
  if (!slide) throw new Error(`Slide index ${args.slideIndex} out of range`);
  const style = await resolveJobStyle(args.jobRef, args.styleId);

  // Look up the existing Hook asset URL from the job doc — that is the
  // visual anchor for every slide in the chain.
  const snap = await args.jobRef.get();
  const job = snap.data() as CarouselJobDoc | undefined;
  const hookSlide = job?.slides?.find((s) => s.index === 0);
  const hookAssetUrl = hookSlide?.assetUrl ?? "";

  await patchSlide(args.jobRef, args.slideIndex, {
    status: "generating",
    errorMessage: undefined,
  });

  const prompt = buildRegeneratePrompt({
    style,
    slide,
    previousSlideAssetUrl: hookAssetUrl,
  });

  try {
    const out = await generateOneSlideWithRetries({
      prompt,
      style,
      workspaceId: args.workspaceId,
      uid: args.uid,
      slideIndex: args.slideIndex,
      slideType: slide.type,
      previousAssetUrl: hookAssetUrl,
      headers: args.headers,
    });

    await patchSlide(args.jobRef, args.slideIndex, {
      status: "complete",
      assetUrl: out.assetUrl,
      assetId: out.assetId,
      provider: out.provider,
      costUsd: out.costUsd,
      width: out.width,
      height: out.height,
      errorMessage: undefined,
    });

    // After a successful regenerate, re-check whether the job as a whole
    // is now clean. If any other slides are still failed, keep
    // hasFailures=true; otherwise flip back to false.
    const refreshed = (await args.jobRef.get()).data() as CarouselJobDoc | undefined;
    const stillFailing = (refreshed?.slides ?? []).some(
      (s) => s.status === "failed"
    );
    await args.jobRef.update({
      hasFailures: stillFailing,
      status: stillFailing ? refreshed?.status ?? "complete" : "complete",
      costUsd: round4(
        (refreshed?.slides ?? []).reduce((sum, s) => sum + (s.costUsd ?? 0), 0)
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { assetUrl: out.assetUrl, assetId: out.assetId, costUsd: out.costUsd };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await patchSlide(args.jobRef, args.slideIndex, {
      status: "failed",
      errorMessage: message,
    });
    throw err;
  }
}

interface GenerateOneSlideArgs {
  prompt: string;
  style: CarouselStyle;
  workspaceId: string;
  uid: string;
  slideIndex: number;
  slideType: SlideType;
  previousAssetUrl: string;
  headers?: Headers;
}

/**
 * Resolve which image-gen provider serves a given slide. The Hook slide
 * can be overridden via `CAROUSEL_HOOK_PROVIDER` env var so we can
 * compare GPT-Image-2 (the default, which silently ignores reference
 * images today) against providers that actually read reference images
 * (e.g. gemini-flash-image) on live output before deciding permanently.
 *
 * Every other slide role always uses GPT-Image-2 — there's no
 * comparable A/B lever and changing them would break the reference
 * chain the spec relies on.
 *
 * Internal testing lever, not a user-facing setting. Invalid values
 * (typo'd env var, deprecated provider id) fall back to gpt-image-2
 * with a warning so a misconfiguration doesn't brick generation.
 */
function resolveCarouselProvider(slideType: SlideType): ProviderId {
  if (slideType !== "hook") return "gpt-image-2";
  const raw = process.env.CAROUSEL_HOOK_PROVIDER?.trim();
  if (!raw) return "gpt-image-2";
  if ((PROVIDER_IDS as readonly string[]).includes(raw)) {
    return raw as ProviderId;
  }
  logger.warn(
    "CAROUSEL_HOOK_PROVIDER is set to an unknown provider — falling back to gpt-image-2",
    { configured: raw, allowed: PROVIDER_IDS }
  );
  return "gpt-image-2";
}

/**
 * QA tier 1 — deterministic dimension check (spec §4). Reject + retry if
 * the returned image isn't the 3:4 aspect ratio we asked for. Same
 * pattern as the fallback-chain walk in image-gen/router.ts, but here
 * scoped to "did the provider give us what we asked for".
 */
function isAcceptableDimensions(width: number, height: number): boolean {
  // 3:4 at 1K — exact multiples of 16 with 1024 long edge.
  if (width === 768 && height === 1024) return true;
  // Fallback chain might surface slightly different sizes if a provider
  // rounded differently; allow a small tolerance.
  const ratio = width / height;
  return Math.abs(ratio - 0.75) < 0.02;
}

async function generateOneSlideWithRetries(
  args: GenerateOneSlideArgs
): Promise<Awaited<ReturnType<typeof generateInfographic>>> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_SLIDE_RETRIES; attempt++) {
    try {
      const out = await generateInfographic({
        workspaceId: args.workspaceId,
        uid: args.uid,
        provider: resolveCarouselProvider(args.slideType),
        prompt: args.prompt,
        aspectRatio: "3:4",
        // Reference-chaining: GPT-Image-2 currently ignores this silently,
        // but the field is plumbed through and any future provider that
        // reads it will pick up the anchor for free. See spec §4 note
        // on belt-and-suspenders.
        referenceImageUrls: args.previousAssetUrl
          ? [args.previousAssetUrl]
          : undefined,
        context: {
          tool: "ads", // re-using the existing 'ads' tool tag for analytics; not user-facing
          styleId: args.style.id,
        },
        headers: args.headers,
      });

      if (!isAcceptableDimensions(out.width, out.height)) {
        throw new Error(
          `Provider returned ${out.width}x${out.height} — expected ~768x1024 (3:4). Rejecting.`
        );
      }
      return out;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("Carousel slide generation attempt failed", {
        slideIndex: args.slideIndex,
        attempt,
        error: message,
      });
      // Don't retry on exhaustion — that means the fallback chain already
      // walked every provider and all failed. Re-throw straight away.
      if (err instanceof ImageGenExhaustedError) throw err;
      if (attempt < MAX_SLIDE_RETRIES) {
        await sleep(1_000 * attempt);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Slide generation failed after retries");
}

async function patchSlide(
  jobRef: FirebaseFirestore.DocumentReference,
  index: number,
  patch: Partial<CarouselJobSlideRecord>
): Promise<void> {
  const snap = await jobRef.get();
  const data = snap.data() as CarouselJobDoc | undefined;
  const slides = data?.slides ?? [];
  const next = slides.map((s) => (s.index === index ? { ...s, ...patch } : s));
  await jobRef.update({
    slides: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Resolve the style a carousel job should run against. M2+ user-built
 * styles are persisted as a full snapshot on the job doc (styleSnapshot)
 * — they're not in the static registry, so a registry lookup alone
 * would throw. Falls back to the registry by styleId for the M1 default.
 */
async function resolveJobStyle(
  jobRef: FirebaseFirestore.DocumentReference,
  styleId: string
): Promise<CarouselStyle> {
  const snap = await jobRef.get();
  const data = snap.data() as CarouselJobDoc | undefined;
  if (data?.styleSnapshot) {
    return data.styleSnapshot;
  }
  return getCarouselStyle(styleId);
}
