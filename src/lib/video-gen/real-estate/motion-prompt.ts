/**
 * video-gen/real-estate/motion-prompt.ts
 * Builds the per-transition keyframe prompt that gets sent to the video
 * model — mirrors whiteboard/motion-prompt.ts's `buildMotionPrompt`
 * shape, but for the Real Estate chain.
 *
 * The narration instruction is appended in code (not trusted to the LLM)
 * so every transition prompt is guaranteed to carry it; without it the
 * rendered clip is silent.
 *
 * The same Groq call that drafts the shot plan also drafts a short
 * `voiceoverLine` per transition (see shot-plan.ts). The model receives
 * the line and narrates it aloud in the requested language.
 */

import "server-only";

const LANGUAGE_NAMES: Record<"fr" | "en" | "ar", string> = {
  fr: "French",
  en: "English",
  ar: "Arabic",
};

/**
 * Appends the spoken-narration instruction to a visual description. Done
 * in code rather than trusted to the model so every transition prompt
 * is guaranteed to carry it — without it the rendered clip is silent.
 *
 * Mirrors whiteboard/script-gen.ts's `withNarrationInstruction` —
 * same discipline, adapted for the real-estate walkthrough wording.
 */
export function withRealEstateNarrationInstruction(
  visual: string,
  voiceoverLine: string,
  language: "fr" | "en" | "ar"
): string {
  const languageName = LANGUAGE_NAMES[language] ?? "English";
  return (
    `${visual.trim().replace(/\s+/g, " ")} ` +
    `A single confident voice narrates aloud in ${languageName}: "${voiceoverLine.trim()}". ` +
    `Warm, professional real-estate-agent tone, natural conversational accent, no on-screen text, no subtitles.`
  );
}
