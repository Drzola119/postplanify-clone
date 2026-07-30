/**
 * video-gen/whiteboard/motion-prompt.ts
 * Converts a ScriptPhase into the final provider-optimised prompt that
 * gets sent to the video generation API.
 *
 * The narration instruction is already embedded inside `visualDirection`
 * by script-gen.ts (see `withNarrationInstruction`). This module only
 * adds the per-provider stylistic suffix and the on-screen text overlay.
 */

import type { ScriptPhase } from "./types";
import type { VideoProviderId } from "../types";

const PROVIDER_SUFFIX: Record<VideoProviderId, string> = {
  "veo-3.1":
    "4K quality, cinematic lighting, smooth motion, photorealistic whiteboard hand-drawn aesthetic.",
  "veo-3.1-lite":
    "HD quality, clean whiteboard animation, smooth transitions, hand-drawn marker style.",
  "gemini-omni-flash":
    "Clean whiteboard animation, flat 2D motion graphics, bold hand-written text.",
  "seedance-2":
    "Short-form social video, bold visuals, high retention, hand-drawn whiteboard look.",
  "seedance-2-fast":
    "Short-form viral video style, bold text, fast-paced hand-drawn whiteboard animation.",
};

/**
 * Build the prompt for one phase. The output is the complete prompt string
 * handed to `generateVideo()` for the assigned provider.
 */
export function buildMotionPrompt(
  phase: ScriptPhase,
  provider: VideoProviderId
): string {
  return [
    phase.visualDirection,
    `On-screen hand-written text overlay: "${phase.onScreenText}".`,
    PROVIDER_SUFFIX[provider],
    `Duration: ${phase.durationSec} seconds.`,
  ]
    .filter(Boolean)
    .join(" ");
}
