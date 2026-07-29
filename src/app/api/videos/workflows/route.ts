/**
 * GET /api/videos/workflows
 * Returns workflow + style metadata for the wizard UI.
 * Mirrors the findStyle() / prompt-styles.ts pattern for infographics.
 */
import { NextResponse } from "next/server";
import { CARTOON_STYLES } from "@/lib/video-gen/workflows/cartoon";

export async function GET() {
  return NextResponse.json({
    workflows: [
      {
        id: "cartoon",
        label: "Cartoon-Style Video",
        description:
          "Turn a topic or image into an animated cartoon short — choose from 3D Pixar, flat 2D, anime, or classic styles.",
        available: true,
        styles: CARTOON_STYLES,
      },
      {
        id: "real-estate",
        label: "Real Estate Listing Video",
        description:
          "Upload property photos and generate a cinematic listing video with branded intro/outro.",
        available: false, // M3
        styles: [],
      },
      {
        id: "whiteboard",
        label: "Whiteboard Explainer",
        description:
          "Turn a script or topic into a hand-drawn-style explainer video.",
        available: false, // M4
        styles: [],
      },
      {
        id: "viral",
        label: "Viral / Trend Short",
        description:
          "Generate a fast-cut, caption-driven short for TikTok, Reels, or YouTube Shorts.",
        available: false, // M2
        styles: [],
      },
    ],
  });
}
