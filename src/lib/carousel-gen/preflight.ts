/**
 * Preflight validation engine for Carousel Studio.
 *
 * Runs automated quality, readability, contrast, safe-zone, and destination checks
 * before high-res export or scheduling to social media platforms.
 */
import {
  type CarouselDocument,
} from "@/lib/carousel-gen/types";
import { checkContrastRatio } from "@/lib/carousel-gen/contrast";

export interface PreflightIssue {
  id: string;
  type: "error" | "warning" | "info";
  slideIndex?: number;
  slideId?: string;
  title: string;
  description: string;
  actionLabel?: string;
  autoFixAvailable?: boolean;
}

export interface PreflightReport {
  passed: boolean;
  score: number; // 0 - 100
  issues: PreflightIssue[];
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
}

export function runPreflightChecks(deck: CarouselDocument): PreflightReport {
  const issues: PreflightIssue[] = [];

  // Check 1: Slide Count Minimum & Maximum
  if (deck.slides.length < 2) {
    issues.push({
      id: "err-slide-min",
      type: "error",
      title: "Too few slides",
      description: "Carousels must contain at least 2 slides for multi-slide social formats.",
      actionLabel: "Add Slide",
    });
  } else if (deck.slides.length > 20) {
    issues.push({
      id: "warn-slide-max",
      type: "warning",
      title: "High slide count",
      description: "Check the selected destination’s slide limit before publishing.",
    });
  }

  // Check 2: Missing Title / Caption
  if (!deck.title || deck.title.trim() === "Untitled Carousel") {
    issues.push({
      id: "info-title",
      type: "info",
      title: "Default Title",
      description: "Consider giving your carousel a descriptive title for library organization.",
    });
  }

  if (!deck.caption || deck.caption.trim().length < 10) {
    issues.push({
      id: "warn-caption",
      type: "warning",
      title: "Missing or short post caption",
      description: "Add context and a clear next step for readers before publishing.",
      actionLabel: "Generate Caption",
    });
  }

  // Check 3: Per-Slide Checks
  deck.slides.forEach((slide, idx) => {
    if(slide.isLegacyFlat)return;
    // 3.1 Headline Empty
    if (!slide.headline || slide.headline.trim().length === 0) {
      issues.push({
        id: `err-headline-empty-${idx}`,
        type: "error",
        slideIndex: idx,
        slideId: slide.id,
        title: `Slide ${idx + 1}: Missing Headline`,
        description: "Every slide must have a headline to guide the reader.",
      });
    }

    // 3.2 Headline Length / Overflow Risk
    if (slide.headline && slide.headline.length > 120) {
      issues.push({
        id: `warn-headline-len-${idx}`,
        type: "warning",
        slideIndex: idx,
        slideId: slide.id,
        title: `Slide ${idx + 1}: Headline very long (${slide.headline.length} chars)`,
        description: "Long headlines may clip or reduce font size below mobile readability thresholds.",
        actionLabel: "Shorten with AI",
      });
    }

    // 3.3 Body Length
    if (slide.body && slide.body.length > 220) {
      issues.push({
        id: `warn-body-len-${idx}`,
        type: "warning",
        slideIndex: idx,
        slideId: slide.id,
        title: `Slide ${idx + 1}: Dense body text`,
        description: "Keep supporting text under 35 words so it stays readable on mobile feeds.",
        actionLabel: "Summarize",
      });
    }

    // 3.4 Color Contrast
    const fg = slide.textColor || deck.brandSnapshot?.colors.text || deck.style.colors.primary;
    const bg = slide.backgroundColor || deck.brandSnapshot?.colors.background || deck.style.colors.background;
    const contrast = checkContrastRatio(fg, bg);
    if (!contrast.passesAA) {
      issues.push({
        id: `err-contrast-${idx}`,
        type: "error",
        slideIndex: idx,
        slideId: slide.id,
        title: `Slide ${idx + 1}: Low text contrast (${contrast.ratio}:1)`,
        description: `Text contrast falls below WCAG AA standard (4.5:1). May be hard to read on mobile.`,
        actionLabel: "Adjust Colors",
      });
    }

    if((slide.fontSizeScale ?? 1)*34<28)issues.push({id:`warn-size-${idx}`,type:'warning',slideIndex:idx,slideId:slide.id,title:`Slide ${idx+1}: Small body text`,description:'Body text is below 28 pixels on a 1080-pixel canvas. Check mobile readability.'});
    if(slide.backgroundImageUrl)issues.push({id:`info-image-${idx}`,type:'info',slideIndex:idx,slideId:slide.id,title:`Slide ${idx+1}: Check image contrast`,description:'Solid-color contrast checks do not account for the image behind text. Inspect the rendered preview.'});
    // 3.5 Safe-Zone Violations on First Slide (Cover / Thumbnail crop)
    if (idx === 0 && deck.aspectRatio === "4:5") {
      // Safe zone note for Instagram profile grid square crop (1080x1080 inside 1080x1350)
      issues.push({
        id: "info-safe-zone-cover",
        type: "info",
        slideIndex: 0,
        slideId: slide.id,
        title: "Instagram 1:1 Grid Safe Zone",
        description: "Ensure main cover hook text stays within the central 1080x1080 square for feed previews.",
      });
    }
  });

  const errorsCount = issues.filter((i) => i.type === "error").length;
  const warningsCount = issues.filter((i) => i.type === "warning").length;
  const infoCount = issues.filter((i) => i.type === "info").length;

  let score = 100 - errorsCount * 25 - warningsCount * 10;
  if (score < 0) score = 0;

  return {
    passed: errorsCount === 0,
    score,
    issues,
    errorsCount,
    warningsCount,
    infoCount,
  };
}
