/**
 * carousel-gen/version-events.ts
 *
 * Client-side helper that the wizard uses to build a CarouselVersion
 * payload from the current CarouselScript. Pure — no network calls,
 * just data shaping so the wizard's 4 trigger points
 * (initial-generate / ai-regenerate / translate / manual-edit) can
 * share the same payload shape sent to /api/carousels/versions/create.
 */

import type { CarouselScript } from "@/lib/carousel-gen/types";
import type { CarouselVersionEditType } from "@/lib/carousel-gen/analytics-types";

export interface PendingVersionEvent {
  editType: CarouselVersionEditType;
  slideCount: number;
  slides: Array<{ slideIndex: number; text: string; backgroundImageUrl?: string }>;
  editedBySlideIndex?: number;
  label?: string;
}

export function buildVersionEventFromScript(
  script: CarouselScript,
  editType: CarouselVersionEditType,
  options: { editedBySlideIndex?: number; label?: string } = {}
): PendingVersionEvent {
  return {
    editType,
    slideCount: script.slides.length,
    slides: script.slides.map((s) => ({
      slideIndex: s.index,
      text: headlineAndBody(s.headline, s.body),
      ...(s.backgroundUrl ? { backgroundImageUrl: s.backgroundUrl } : {}),
    })),
    ...(options.editedBySlideIndex !== undefined
      ? { editedBySlideIndex: options.editedBySlideIndex }
      : {}),
    ...(options.label ? { label: options.label } : {}),
  };
}

function headlineAndBody(headline: string, body?: string): string {
  if (!body) return headline;
  return `${headline}\n${body}`;
}

/** Shallow compare two events — true if their slide text content is identical. */
export function isSameVersionEvent(
  a: PendingVersionEvent | null,
  b: PendingVersionEvent
): boolean {
  if (!a) return false;
  if (a.slideCount !== b.slideCount) return false;
  for (let i = 0; i < a.slides.length; i++) {
    if (a.slides[i]?.text !== b.slides[i]?.text) return false;
    if (a.slides[i]?.backgroundImageUrl !== b.slides[i]?.backgroundImageUrl) {
      return false;
    }
  }
  return true;
}
