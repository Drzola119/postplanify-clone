/**
 * video-gen/real-estate/shot-plan.ts
 * Generates a Real Estate shot plan via Groq — mirrors whiteboard/script-gen.ts's
 * callGroq + extractJson + jsonMode pattern exactly.
 *
 * One Groq call produces BOTH the property shot plan AND an optional
 * voiceover script (when voiceover is enabled), so the expensive LLM
 * step is paid for once.
 *
 * Continuity language ("preserve the same X, do not repeat Y as the
 * main subject") is baked into the prompt template fragments in code,
 * not re-derived by the LLM every shot — that's the discipline that
 * makes reference-chained generation actually hold identity.
 */

import "server-only";
import { callGroq, extractJson, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import type { RealEstateAiGeneratedRequest } from "@/lib/validation/video-gen";
import { getPropertyStyle } from "./styles";
import type {
  CameraDirection,
  PropertyShot,
  PropertyShotPlan,
  PropertyTransition,
} from "./types";

/**
 * The 10-shot skeleton, in order. This is the fixed structure that every
 * generation runs against — style descriptors and the property
 * description vary; the room sequence does not.
 */
const SHOT_SKELETON: Array<{ label: string; role: string; reference: number[] }> = [
  { label: "Front Exterior",       role: "façade",          reference: [] },
  { label: "Foyer / Entryway",     role: "entryway",        reference: [0] },
  { label: "Open-Plan Living",     role: "living-room",     reference: [1] },
  { label: "Dining / Stairs",      role: "dining",          reference: [2] },
  { label: "Kitchen Hero",         role: "kitchen-wide",    reference: [3] },
  { label: "Kitchen Detail",       role: "kitchen-detail",  reference: [4] }, // shot 5 refs shot 4
  { label: "Living Room Wide",     role: "living-wide",     reference: [5] },
  { label: "Patio / Outdoor",      role: "patio",           reference: [6] },
  { label: "Rear Exterior",        role: "backyard",        reference: [7] },
  { label: "Aerial with Pool",     role: "aerial",          reference: [8] },
];

/**
 * The 9 transitions between consecutive shots. Camera directions
 * deliberately alternate so the route doesn't feel repetitive —
 * lifted from the tutorial script the user shared.
 */
const TRANSITION_DIRECTIONS: CameraDirection[] = [
  "forward",     // 0 → 1 entryway
  "forward",     // 1 → 2 living
  "turn-right",  // 2 → 3 dining/stairs
  "forward",     // 3 → 4 kitchen hero
  "forward",     // 4 → 5 kitchen detail
  "backward",    // 5 → 6 living wide
  "turn-right",  // 6 → 7 patio
  "forward",     // 7 → 8 rear exterior
  "tilt-up",     // 8 → 9 aerial
];

/**
 * Hand-written continuity fragments spliced into each shot's prompt.
 * Kept in code (not trusted to the LLM) so the discipline that makes
 * reference-chaining work is guaranteed.
 *
 * Exported as CONTINUITY_FRAGMENTS_FOR_COMMIT so the commit endpoint can
 * re-derive prompts without re-running Groq — see /api/videos/real-estate/route.ts.
 */
export const CONTINUITY_FRAGMENTS_FOR_COMMIT: Record<number, string> = {
  0: "Establishing shot of the property — set the visual identity that every later shot must preserve.",
  1: "Using Image 1 (Front Exterior) as reference — preserve the same house identity, same exterior materials, same colour palette. Do not repeat the façade as the main subject; show the interior entryway that matches.",
  2: "Using Image 2 (Foyer) as reference — same architecture, same materials, same natural light direction. Move deeper into the open-plan living area.",
  3: "Using Image 3 (Open-Plan Living) as reference — same ceiling height, same flooring, same window proportions. Now show the dining area and staircase.",
  4: "Using Image 4 (Dining / Stairs) as reference — same flooring continues, same cabinetry wood tone. Reveal the kitchen as the hero of this shot.",
  5: "Using Image 5 (Kitchen Hero) as reference — same kitchen layout, same cabinetry, same appliances, same counter material. Now show one detailed close-up of the kitchen (a counter, an island detail, or a feature appliance).",
  6: "Using Image 6 (Kitchen Detail) and Image 5 (Kitchen Hero) as reference — same materials throughout. Pull back to a wide living-room shot that re-establishes the home's flow.",
  7: "Using Image 7 (Living Room Wide) as reference — same flooring, same wall colour. Move outdoors through to the patio / covered lanai.",
  8: "Using Image 8 (Patio) as reference — same exterior materials, same landscaping style. Show the rear exterior of the home.",
  9: "Using Image 9 (Rear Exterior) as reference — same roofline, same architectural language. Lift up to an aerial drone-style shot that includes the pool if present.",
};

const CONTINUITY_FRAGMENTS = CONTINUITY_FRAGMENTS_FOR_COMMIT;

const NO_TEXT_RULE =
  "No on-image text, no logos, no watermarks, no overlays. Photorealistic architectural photography style.";

function buildSkeletonPrompt(
  req: RealEstateAiGeneratedRequest,
  styleDescriptors: string
): string {
  return SHOT_SKELETON.map((s, i) => {
    const cont = CONTINUITY_FRAGMENTS[i] ?? "";
    return `Shot ${i} — ${s.label} (${s.role}): ${cont} Style: ${styleDescriptors}. ${NO_TEXT_RULE}`;
  }).join("\n\n");
}

const SYSTEM_PROMPT = `You are an architectural-listing copywriter. Produce a JSON plan for a property walkthrough video.

Given a property description and a style preset, output:
- shots: an array of objects { roomLabel, imagePrompt, cameraNote } — one per shot, in order, EXACTLY matching the skeleton's shot count and labels. Refine the roomLabel if the skeleton feels generic for this property. Build a vivid, specific imagePrompt per shot by combining (a) the skeleton's continuity instructions verbatim, (b) the style descriptors verbatim, (c) two or three concrete details lifted from the property description (specific materials, rooms, features). Do not invent features not implied by the description.
- voiceoverScript (optional): one short continuous narration in the requested language, ~30–55 seconds when read aloud at natural pace, that walks the viewer through the property. Plain text, no quotes, no stage directions, no emoji, no leading preamble. If voiceover is disabled, omit this field entirely.

Rules:
- Each imagePrompt MUST start by referencing the exact continuity instruction for that shot — those are non-negotiable, they are what makes the chain hold together.
- Each imagePrompt MUST end with the no-text/no-logo rule.
- cameraNote: one short phrase describing how the camera moves at this beat ("forward into the room", "turn right toward the stairs", "tilt up for the reveal"). This will be mapped to a fixed enum.
- language: confirm the language of voiceoverScript matches the request.
- Do not output any prose outside the JSON.

Respond with JSON only, shaped:
{"shots":[{"roomLabel":"...","imagePrompt":"...","cameraNote":"..."}],"voiceoverScript":"..."}`;

interface RawShot {
  roomLabel?: unknown;
  imagePrompt?: unknown;
  cameraNote?: unknown;
}

interface RawPlan {
  shots?: RawShot[];
  voiceoverScript?: unknown;
}

const CAMERA_DIRECTION_ALIASES: Array<{ match: RegExp; dir: CameraDirection }> = [
  { match: /\bforward\b/i, dir: "forward" },
  { match: /\bbackward\b/i, dir: "backward" },
  { match: /\bturn[- ]?left\b|\bleft\b/i, dir: "turn-left" },
  { match: /\bturn[- ]?right\b|\bright\b/i, dir: "turn-right" },
  { match: /\btilt[- ]?up\b|\bup\b|\breveal\b/i, dir: "tilt-up" },
  { match: /\btilt[- ]?down\b|\bdown\b/i, dir: "tilt-down" },
];

function mapCameraNoteToDirection(note: string, fallback: CameraDirection): CameraDirection {
  for (const { match, dir } of CAMERA_DIRECTION_ALIASES) {
    if (match.test(note)) return dir;
  }
  return fallback;
}

export interface GenerateShotPlanResult {
  plan: PropertyShotPlan;
  voiceoverScript?: string;
}

export async function generateRealEstateShotPlan(
  req: RealEstateAiGeneratedRequest,
  apiKey: string
): Promise<GenerateShotPlanResult> {
  const style = getPropertyStyle(req.styleId);
  if (!style) {
    throw new Error(`Unknown property style: ${req.styleId}`);
  }

  const skeleton = buildSkeletonPrompt(req, style.descriptors);
  const shotCount = req.shotCount ?? SHOT_SKELETON.length;

  // If the user asked for fewer than the full 10 shots, trim the skeleton.
  const trimmedSkeleton =
    shotCount >= SHOT_SKELETON.length
      ? skeleton
      : SHOT_SKELETON.slice(0, shotCount)
          .map((s, i) => {
            const cont = CONTINUITY_FRAGMENTS[i] ?? "";
            return `Shot ${i} — ${s.label} (${s.role}): ${cont} Style: ${style.descriptors}. ${NO_TEXT_RULE}`;
          })
          .join("\n\n");

  const trimmedDirections = TRANSITION_DIRECTIONS.slice(0, Math.max(0, shotCount - 1));

  const userPrompt = [
    `Property description: ${req.propertyDescription}`,
    `Style preset: ${style.label} — ${style.descriptors}`,
    `Target shot count: ${shotCount}`,
    `Voiceover enabled: ${req.voiceover?.enabled ? "yes" : "no"}`,
    `Voiceover language: ${req.language}`,
    `Language for any on-image text: ${req.language}`,
    "",
    "Shot skeleton (use these roomLabel values verbatim unless refining, keep continuity language intact, splice in style descriptors verbatim):",
    trimmedSkeleton,
  ].join("\n");

  const { content } = await callGroq({
    apiKey,
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 200 + 250 * shotCount,
    jsonMode: true,
  });

  const parsed = extractJson<RawPlan>(content);
  const rawShots = Array.isArray(parsed?.shots) ? parsed.shots : [];
  if (rawShots.length < shotCount) {
    throw new Error(
      `Shot plan generation returned ${rawShots.length} shots, expected ${shotCount}`
    );
  }

  const shots: PropertyShot[] = rawShots.slice(0, shotCount).map((raw, i) => {
    const skeletonShot = SHOT_SKELETON[i];
    const roomLabel =
      typeof raw.roomLabel === "string" && raw.roomLabel.trim().length > 0
        ? raw.roomLabel.trim().slice(0, 80)
        : skeletonShot?.label ?? `Shot ${i + 1}`;
    const imagePrompt =
      typeof raw.imagePrompt === "string" && raw.imagePrompt.trim().length > 0
        ? raw.imagePrompt.trim()
        : `${CONTINUITY_FRAGMENTS[i] ?? ""} ${style.descriptors}. ${NO_TEXT_RULE}`;
    return {
      index: i,
      roomLabel,
      imagePrompt,
      referenceShotIndexes: skeletonShot?.reference ?? [],
      status: "pending",
    };
  });

  const transitions: PropertyTransition[] = [];
  for (let i = 0; i < shots.length - 1; i++) {
    const raw = rawShots[i];
    const cameraNote =
      typeof raw?.cameraNote === "string" ? raw.cameraNote : "";
    transitions.push({
      index: i,
      fromShotIndex: i,
      toShotIndex: i + 1,
      cameraDirection: mapCameraNoteToDirection(cameraNote, trimmedDirections[i] ?? "forward"),
      status: "pending",
    });
  }

  const voiceoverScript =
    typeof parsed?.voiceoverScript === "string" && parsed.voiceoverScript.trim().length > 0
      ? parsed.voiceoverScript.trim().slice(0, 1200)
      : undefined;

  const plan: PropertyShotPlan = {
    mode: "ai-generated",
    styleId: style.id,
    shots,
    transitions,
    voiceover: req.voiceover?.enabled
      ? { enabled: true, language: req.language, script: voiceoverScript }
      : undefined,
  };

  return { plan, voiceoverScript };
}

/**
 * Build a shot plan for "my-photos" mode from a user's uploaded asset URLs.
 * No LLM call — the photos themselves define the sequence.
 */
export function buildShotPlanFromPhotos(args: {
  styleId: string;
  photoAssetIds: string[];
  photoAssetUrls: string[];
  language: "fr" | "en" | "ar";
  voiceoverEnabled: boolean;
  voiceoverScript?: string;
}): PropertyShotPlan {
  const { photoAssetIds, photoAssetUrls, styleId, language, voiceoverEnabled, voiceoverScript } = args;
  if (photoAssetIds.length !== photoAssetUrls.length) {
    throw new Error("photoAssetIds and photoAssetUrls must be the same length");
  }
  if (photoAssetIds.length < 2) {
    throw new Error("Need at least 2 photos to produce transitions");
  }
  const N = photoAssetIds.length;
  const shots: PropertyShot[] = photoAssetUrls.map((url, i) => ({
    index: i,
    roomLabel: `Photo ${i + 1}`,
    imagePrompt: "", // No generation — user photos ARE the shots
    referenceShotIndexes: i === 0 ? [] : [i - 1],
    imageUrl: url,
    status: "complete",
  }));
  const transitions: PropertyTransition[] = [];
  for (let i = 0; i < N - 1; i++) {
    transitions.push({
      index: i,
      fromShotIndex: i,
      toShotIndex: i + 1,
      cameraDirection: TRANSITION_DIRECTIONS[i] ?? "forward",
      status: "pending",
    });
  }
  return {
    mode: "my-photos",
    styleId,
    shots,
    transitions,
    voiceover: voiceoverEnabled
      ? {
          enabled: true,
          language,
          script: voiceoverScript,
        }
      : undefined,
  };
}
