import { describe, it, expect } from "vitest";
import {
  createInitialSlides,
} from "@/lib/carousel-gen/document-service";
import { checkContrastRatio } from "@/lib/carousel-gen/brand-kits";
import { runPreflightChecks } from "@/lib/carousel-gen/preflight";
import {
  generateOutlineFromSource,
  applySurgicalRefinement,
} from "@/lib/carousel-gen/repurpose";
import {
  type CarouselDocument,
  type CarouselSlideItem,
  ASPECT_RATIO_DIMENSIONS,
} from "@/lib/carousel-gen/types";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";

describe("Carousel Studio - Document Model & Initial Slides", () => {
  it("creates valid initial slides with stable IDs and standard roles", () => {
    const slides = createInitialSlides(5);
    expect(slides).toHaveLength(5);
    expect(slides[0].type).toBe("hook");
    expect(slides[4].type).toBe("cta");
    expect(slides[0].id).toMatch(/^sld_/);
    expect(slides[1].id).not.toBe(slides[0].id);
  });

  it("handles custom slide counts and assigns roles appropriately", () => {
    const slides = createInitialSlides(7);
    expect(slides).toHaveLength(7);
    expect(slides[0].type).toBe("hook");
    expect(slides[6].type).toBe("cta");
  });
});

describe("Carousel Studio - Brand Kits & WCAG Contrast Validation", () => {
  it("passes WCAG AA contrast check for high contrast black on white", () => {
    const contrast = checkContrastRatio("#000000", "#ffffff");
    expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    expect(contrast.passesAA).toBe(true);
  });

  it("fails WCAG AA contrast check for low contrast light gray on white", () => {
    const contrast = checkContrastRatio("#cccccc", "#ffffff");
    expect(contrast.ratio).toBeLessThan(4.5);
    expect(contrast.passesAA).toBe(false);
  });
});

describe("Carousel Studio - Preflight Validation Engine", () => {
  const dummyDeck: CarouselDocument = {
    id: "csl_test",
    workspaceId: "ws_123",
    title: "Mastering Inbound Pipeline",
    aspectRatio: "4:5",
    dimensions: ASPECT_RATIO_DIMENSIONS["4:5"],
    status: "draft",
    tags: [],
    style: DEFAULT_CAROUSEL_STYLE,
    slides: [
      {
        id: "s1",
        index: 0,
        type: "hook",
        headline: "How to 4x Inbound Pipeline in 90 Days",
        subheadline: "Swipe for the exact framework",
      },
      {
        id: "s2",
        index: 1,
        type: "value",
        headline: "Step 1: Focus on High-Signal Teardowns",
        body: "Audit client problems publicly rather than publishing generic motivational tips.",
      },
      {
        id: "s3",
        index: 2,
        type: "cta",
        headline: "Save this carousel and comment 'INBOUND'",
        body: "We will DM you the complete SOP.",
      },
    ],
    slideCount: 3,
    caption: "The complete 90-day playbook to scale pipeline without paid ads. Comment INBOUND below!",
    currentRevisionId: "rev_1",
    revisionCount: 1,
    reviewStatus: "none",
    mediaUrls: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: "uid_123",
  };

  it("evaluates a pristine deck with high score and passed state", () => {
    const report = runPreflightChecks(dummyDeck);
    expect(report.passed).toBe(true);
    expect(report.errorsCount).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });

  it("detects missing headline as a blocking error", () => {
    const brokenDeck: CarouselDocument = {
      ...dummyDeck,
      slides: [
        { ...dummyDeck.slides[0], headline: "" },
        dummyDeck.slides[1],
      ],
    };
    const report = runPreflightChecks(brokenDeck);
    expect(report.passed).toBe(false);
    expect(report.errorsCount).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.id.includes("err-headline-empty"))).toBe(true);
  });

  it("flags short/missing caption as a warning", () => {
    const noCapDeck: CarouselDocument = {
      ...dummyDeck,
      caption: "",
    };
    const report = runPreflightChecks(noCapDeck);
    expect(report.warningsCount).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.id === "warn-caption")).toBe(true);
  });
});

describe("Carousel Studio - AI Repurposing & Surgical Refinements", () => {
  it("generates an outline with hook, progression, and CTA from raw source text", () => {
    const rawText =
      "Building in public creates immense distribution. First, share your failures transparently so people trust your journey. Second, document your daily metrics and learnings. Third, offer free templates to build an email list. Finally, ask your audience what product they want built.";
    const outline = generateOutlineFromSource(rawText, 5);
    expect(outline.hook).toBeTruthy();
    expect(outline.outlineSteps).toHaveLength(3);
    expect(outline.suggestedCta).toBeTruthy();
  });

  it("applies surgical text shortening without touching other attributes", () => {
    const slide: CarouselSlideItem = {
      id: "s_test",
      index: 0,
      type: "hook",
      headline: "The Extremely Long Headline That Could Be Shortened By AI To Fit Mobile",
      body: "This is a detailed paragraph with a lot of words that can be shortened.",
    };
    const shortened = applySurgicalRefinement({ slide, action: "shorten" });
    expect(shortened.headline.split(" ").length).toBeLessThanOrEqual(6);
  });

  it("respects locked slides and avoids mutating them", () => {
    const slide: CarouselSlideItem = {
      id: "s_locked",
      index: 0,
      type: "hook",
      headline: "Locked Headline",
      isLocked: true,
    };
    const unchanged = applySurgicalRefinement({ slide, action: "shorten" });
    expect(unchanged.headline).toBe("Locked Headline");
  });

  it("adjusts text alignment to right when translating to Arabic", () => {
    const slide: CarouselSlideItem = {
      id: "s_ar",
      index: 0,
      type: "hook",
      headline: "Introduction",
      textAlign: "left",
    };
    const arSlide = applySurgicalRefinement({
      slide,
      action: "translate",
      targetLanguage: "ar",
    });
    expect(arSlide.textAlign).toBe("right");
  });
});
