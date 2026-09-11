import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";
import { DEFAULT_CAROUSEL_STYLE } from "./styles";
import { ASPECT_RATIO_DIMENSIONS, type CarouselDocument } from "./types";
export function templateDocument(id: string): CarouselDocument {
  const t = CAROUSEL_TEMPLATES.find((t) => t.id === id);
  if (!t) throw Error("Template not found");
  const roles = ["hook", "value", "value", "value", "cta"] as const;
  const preset = t.slides ?? [
    {
      headline: t.name,
      type: "hook" as const,
      body: "A practical guide for your audience.",
    },
    {
      headline: "Start with the challenge",
      body: "Describe the problem your audience recognizes.",
    },
    {
      headline: "Explain your approach",
      body: "Share one specific action and why it helps.",
    },
    {
      headline: "Show a concrete example",
      body: "Replace this text with verified evidence or an example.",
    },
    {
      headline: "Choose your next step",
      type: "cta" as const,
      body: "Invite your audience to save, share, or learn more.",
    },
  ];
  const slides = preset.map((s, i) => ({
    ...s,
    id: `template_${id}_${i}`,
    index: i,
    type: s.type || roles[Math.min(i, 4)],
    headline: s.headline || "",
    layoutId:
      i === 0
        ? "bold-headline"
        : i === preset.length - 1
          ? "centered"
          : "split",
    textAlign:
      i === preset.length - 1 ? ("center" as const) : ("left" as const),
  }));
  return {
    id,
    workspaceId: "template",
    title: t.name,
    status: "draft",
    aspectRatio: "4:5",
    dimensions: ASPECT_RATIO_DIMENSIONS["4:5"],
    tags: [t.category || t.niche],
    style: {
      ...DEFAULT_CAROUSEL_STYLE,
      ...t.style,
      colors: { ...DEFAULT_CAROUSEL_STYLE.colors, ...t.style?.colors },
      fonts: { display: "Noto Sans", body: "Noto Sans" },
    },
    slides,
    slideCount: slides.length,
    caption: "",
    currentRevisionId: "rev_1",
    revisionCount: 1,
    reviewStatus: "none",
    mediaUrls: [],
    createdAt: 0,
    updatedAt: 0,
    createdBy: "",
  };
}
