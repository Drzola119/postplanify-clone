/**
 * video-gen/whiteboard/script-gen.ts
 * Turns a whiteboard request + clip matrix into a phase-by-phase script via Groq.
 * Server-only.
 *
 * The generated `visualDirection` is the prompt that later gets sent to the
 * video model. It carries the narration instruction, which is how the final
 * clip ends up with audio — there is no TTS step anywhere in this pipeline.
 */

import "server-only";
import { callGroq, extractJson, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import type { WhiteboardRequest } from "@/lib/validation/video-gen";
import type { ClipSpec } from "./clip-matrix";
import type { ScriptPhase, WhiteboardScript } from "./types";

/**
 * Narrative skeletons per clip count. A 3-clip video can only afford
 * hook/value/CTA; a 12-clip video has room for proof and objection handling.
 */
const PHASE_LABELS_BY_COUNT: Record<number, string[]> = {
  3: ["Hook", "Value", "CTA"],
  4: ["Hook", "Problem", "Solution", "CTA"],
  6: ["Hook", "Problem", "Mechanism", "Proof", "Scalability", "CTA"],
  8: [
    "Hook",
    "Context",
    "Problem",
    "Mechanism",
    "Proof",
    "Scalability",
    "Urgency",
    "CTA",
  ],
  12: [
    "Hook",
    "Context",
    "Problem",
    "Agitation",
    "Mechanism",
    "Proof-1",
    "Proof-2",
    "Case Study",
    "Scalability",
    "Objection",
    "Urgency",
    "CTA",
  ],
};

const LANGUAGE_NAMES: Record<WhiteboardRequest["language"], string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  pt: "Portuguese",
  de: "German",
};

export function phaseLabelsFor(clipCount: number): string[] {
  return (
    PHASE_LABELS_BY_COUNT[clipCount] ??
    Array.from({ length: clipCount }, (_, i) => `Part ${i + 1}`)
  );
}

/**
 * Appends the spoken-narration instruction to a visual description. Done in
 * code rather than trusted to the model so every phase prompt is guaranteed
 * to carry it — without it the rendered clip is silent.
 */
export function withNarrationInstruction(
  visual: string,
  voiceover: string,
  languageName: string
): string {
  return (
    `${visual.trim().replace(/\s+/g, " ")} ` +
    `A single confident voice narrates aloud in ${languageName}, in sync with the drawing: "${voiceover.trim()}". ` +
    `Marker-on-whiteboard hand-drawn look, white background, black marker with one accent colour, ` +
    `a hand entering frame to draw. No subtitles or captions — the only text in frame is the hand-written words.`
  );
}

interface RawPhase {
  voiceover?: unknown;
  onScreenText?: unknown;
  visualDirection?: unknown;
}

function buildSystemPrompt(clipSpec: ClipSpec, labels: string[]): string {
  return [
    "You are a direct-response scriptwriter for hand-drawn whiteboard explainer videos.",
    `Write exactly ${clipSpec.clipCount} phases, one per ${clipSpec.clipDurationSec}-second clip.`,
    `The phases follow this narrative arc, in order: ${labels.join(" → ")}.`,
    "",
    "For every phase produce:",
    `- voiceover: what is spoken aloud. Must be speakable in ${clipSpec.clipDurationSec} seconds (roughly ${Math.round(clipSpec.clipDurationSec * 2.5)} words). No stage directions, no emoji, no quotes.`,
    "- onScreenText: 2-5 bold words that get hand-written on the whiteboard for this phase.",
    "- visualDirection: one sentence describing what the hand draws (objects, arrows, diagrams). Describe drawings only — do not mention audio, narration, camera settings, or subtitles.",
    "",
    "Rules: each phase must advance the argument, never repeat an earlier phase. The final phase must contain the call to action.",
    "",
    'Respond with JSON only, shaped: {"phases":[{"voiceover":"...","onScreenText":"...","visualDirection":"..."}]}',
  ].join("\n");
}

function buildUserPrompt(req: WhiteboardRequest, clipSpec: ClipSpec): string {
  return [
    `Topic: ${req.topic}`,
    `Mood: ${req.mood}`,
    `Language: ${LANGUAGE_NAMES[req.language]}`,
    `Total video length: ${clipSpec.actualTotalSec} seconds`,
    `Aspect ratio: ${req.aspectRatio}`,
    req.cta ? `Call to action (use verbatim in the final phase): ${req.cta}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateWhiteboardScript(
  req: WhiteboardRequest,
  clipSpec: ClipSpec,
  apiKey: string
): Promise<WhiteboardScript> {
  const labels = phaseLabelsFor(clipSpec.clipCount);
  const languageName = LANGUAGE_NAMES[req.language];

  const { content } = await callGroq({
    apiKey,
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(clipSpec, labels) },
      { role: "user", content: buildUserPrompt(req, clipSpec) },
    ],
    temperature: 0.82,
    maxTokens: 400 * clipSpec.clipCount,
    jsonMode: true,
  });

  const parsed = extractJson<{ phases?: RawPhase[] }>(content);
  const rawPhases = Array.isArray(parsed?.phases) ? parsed.phases : [];

  if (rawPhases.length < clipSpec.clipCount) {
    throw new Error(
      `Script generation returned ${rawPhases.length} phases, expected ${clipSpec.clipCount}`
    );
  }

  const phases: ScriptPhase[] = rawPhases
    .slice(0, clipSpec.clipCount)
    .map((raw, index) => {
      const voiceover = typeof raw.voiceover === "string" ? raw.voiceover.trim() : "";
      const onScreenText =
        typeof raw.onScreenText === "string" ? raw.onScreenText.trim() : labels[index];
      const visual =
        typeof raw.visualDirection === "string" && raw.visualDirection.trim().length > 0
          ? raw.visualDirection
          : `A hand draws a simple diagram illustrating "${labels[index]}" for the topic ${req.topic}.`;
      const startSec = index * clipSpec.clipDurationSec;

      return {
        index,
        label: labels[index],
        startSec,
        endSec: startSec + clipSpec.clipDurationSec,
        durationSec: clipSpec.clipDurationSec,
        voiceover,
        onScreenText,
        visualDirection: withNarrationInstruction(visual, voiceover, languageName),
      };
    });

  return {
    topic: req.topic,
    totalSec: clipSpec.actualTotalSec,
    clipCount: clipSpec.clipCount,
    clipDurationSec: clipSpec.clipDurationSec,
    phases,
  };
}
