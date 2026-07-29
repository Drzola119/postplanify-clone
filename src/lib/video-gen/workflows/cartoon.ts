/**
 * video-gen/workflows/cartoon.ts
 * Server-side prompt builder for the Cartoon-Style Video workflow.
 * The client NEVER sees raw prompt templates — same privacy posture as infographics.
 */

export type CartoonSubStyle =
  | "pixar-3d"
  | "flat-2d"
  | "anime"
  | "saturday-morning";

export interface CartoonWorkflowInput {
  /** Topic/hook (if no source image) or ignored (if image provided) */
  topic?: string;
  subStyle: CartoonSubStyle;
  durationSec: 5 | 8 | 10 | 15;
  /** Optional single dialogue or SFX line — passed into prompt for native audio */
  dialogueLine?: string;
  /** If provided, mode becomes image-to-video */
  sourceImageUrl?: string;
}

const SUBSTYLE_DESCRIPTORS: Record<CartoonSubStyle, string> = {
  "pixar-3d":
    "vibrant 3D CGI Pixar-style animation, expressive character design, rich lighting, cinematic composition, family-friendly tone",
  "flat-2d":
    "clean flat 2D vector animation, bold outlines, limited-palette color blocks, smooth motion-graphics style, modern explainer aesthetic",
  anime:
    "Japanese anime style, dynamic speed lines, expressive large eyes, sakura palette, fluid action animation, cel-shading",
  "saturday-morning":
    "classic Saturday-morning cartoon style, bright primary colours, soft rounded character designs, light-hearted slapstick energy, retro 1980s animation aesthetic",
};

/**
 * Build the text-to-video or image-to-video prompt for a Cartoon clip.
 * Returns both the prompt string and the resolved mode.
 */
export function buildCartoonPrompt(input: CartoonWorkflowInput): {
  prompt: string;
  mode: "text-to-video" | "image-to-video";
} {
  const style = SUBSTYLE_DESCRIPTORS[input.subStyle];
  const hasImage = Boolean(input.sourceImageUrl);

  let prompt: string;

  if (hasImage) {
    // Image-to-video: animate the source image in the chosen cartoon style
    prompt = [
      `Animate this image in ${style}.`,
      "Bring the scene to life with smooth, expressive motion.",
      "No on-screen text or watermarks.",
      "Loopable or naturally ending short clip.",
      input.dialogueLine
        ? `Include this audio/dialogue: "${input.dialogueLine}".`
        : "Add fitting ambient sound and light background music.",
    ]
      .filter(Boolean)
      .join(" ");
  } else {
    // Text-to-video: generate from topic
    const topicLine = input.topic
      ? `Topic or concept to visualise: "${input.topic}".`
      : "Create an engaging, original cartoon scene.";

    prompt = [
      topicLine,
      `Visual style: ${style}.`,
      "Smooth, professional animation with natural motion.",
      "No on-screen text, logos, or watermarks.",
      input.dialogueLine
        ? `Include this spoken dialogue or sound effect: "${input.dialogueLine}".`
        : "Include fitting ambient soundscape and subtle background music.",
      `Duration: approximately ${input.durationSec} seconds.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return {
    prompt,
    mode: hasImage ? "image-to-video" : "text-to-video",
  };
}

/** Cartoon workflow style metadata for the wizard UI */
export const CARTOON_STYLES = [
  {
    id: "cartoon-pixar-3d",
    label: "3D Pixar-Style",
    description: "Cinematic 3D animation à la Pixar/DreamWorks",
    subStyle: "pixar-3d" as CartoonSubStyle,
    thumbnailPath: "/images/styles/cartoon-pixar-3d.webp",
  },
  {
    id: "cartoon-flat-2d",
    label: "Flat 2D Vector",
    description: "Clean, modern motion-graphics look",
    subStyle: "flat-2d" as CartoonSubStyle,
    thumbnailPath: "/images/styles/cartoon-flat-2d.webp",
  },
  {
    id: "cartoon-anime",
    label: "Anime",
    description: "Japanese animation style with dynamic motion",
    subStyle: "anime" as CartoonSubStyle,
    thumbnailPath: "/images/styles/cartoon-anime.webp",
  },
  {
    id: "cartoon-saturday-morning",
    label: "Saturday Morning Cartoon",
    description: "Classic retro cartoon style from the 80s",
    subStyle: "saturday-morning" as CartoonSubStyle,
    thumbnailPath: "/images/styles/cartoon-saturday-morning.webp",
  },
] as const;
