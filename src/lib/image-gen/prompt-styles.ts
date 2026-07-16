import "server-only";

/**
 * Our own catalogue of infographic "styles". Each entry is original
 * wording inspired by the teardown's broad category groupings — we never
 * lift a specific category name from the third-party source.
 *
 * Two parallel arrays: `INSTANT_STYLES` for the keyword-driven tool, and
 * `ADS_STYLES` for the offer/landing-page-driven tool. Each style carries
 * a `directive` (one-sentence creative angle used by the prompt builder)
 * and a `format` hint that drives aspect-ratio defaults in the UI.
 */

export type InfographicFormat =
  | "list"
  | "comparison"
  | "process"
  | "framework"
  | "snapshot"
  | "story";

export interface PromptStyle {
  id: string;
  title: string;
  summary: string;
  directive: string;
  format: InfographicFormat;
  tags: string[];
}

export const INSTANT_STYLES: PromptStyle[] = [
  {
    id: "roadmap",
    title: "Pathway map",
    summary: "A linear walk-through of the topic as a sequence of signposted stops.",
    directive:
      "Lay out the topic as a horizontal pathway of 5 to 7 signposted stops, " +
      "each stop a milestone the viewer is moving toward; use a single accent " +
      "colour for the path and keep every stop card visually identical so the " +
      "progression reads at a glance.",
    format: "process",
    tags: ["process", "framework"],
  },
  {
    id: "comparison",
    title: "Side-by-side trade-off",
    summary: "Two columns that weigh the topic from opposite angles.",
    directive:
      "Render the topic as a two-column trade-off with mirrored icons and " +
      "matching row counts; the left column should feel reassuringly familiar " +
      "while the right should feel aspirational or surprising.",
    format: "comparison",
    tags: ["contrast", "decision"],
  },
  {
    id: "checklist",
    title: "Recognition checklist",
    summary: "A list of specific signals the viewer is already noticing.",
    directive:
      "Frame the topic as a checklist of 6 to 9 specific, named signals the " +
      "viewer is likely already noticing in their own day; each item should " +
      "feel concrete and self-identifying, never generic.",
    format: "list",
    tags: ["self-recognition", "saveable"],
  },
  {
    id: "timeline",
    title: "Time-splice timeline",
    summary: "Before / during / after — a three-act beat across the topic.",
    directive:
      "Slice the topic into three labelled beats (before, during, after) " +
      "running left-to-right; emphasise contrast between the first and last " +
      "beat using identical layouts with mirrored colour palettes.",
    format: "process",
    tags: ["story", "transformation"],
  },
  {
    id: "framework",
    title: "Three-part framework",
    summary: "A clean three-block mental model with named legs.",
    directive:
      "Reduce the topic to exactly three named blocks arranged in a triangle " +
      "or vertical stack; each block should be a one-word noun and a single " +
      "supporting line, with no body copy beyond that.",
    format: "framework",
    tags: ["mental-model", "framework"],
  },
  {
    id: "snapshot",
    title: "Big-number snapshot",
    summary: "One anchor statistic with a small surrounding context grid.",
    directive:
      "Pick the single most compelling number in the topic and make it the " +
      "visual anchor (occupying at least 40% of the canvas); surround it with " +
      "3 to 4 supporting mini-stats arranged in a clean grid.",
    format: "snapshot",
    tags: ["stat", "scroll-stopper"],
  },
  {
    id: "iceberg",
    title: "Layered depth",
    summary: "Visible surface vs hidden depth — what's above and below the line.",
    directive:
      "Split the canvas horizontally; the upper half shows what is visible " +
      "or obvious about the topic, the lower half shows the deeper drivers " +
      "most people miss; the dividing line should be visually heavy.",
    format: "framework",
    tags: ["depth", "explanation"],
  },
  {
    id: "stack",
    title: "Layered stack",
    summary: "A pyramid of stacked layers from foundational to advanced.",
    directive:
      "Stack the topic into 4 to 5 horizontal layers from most foundational " +
      "(bottom) to most advanced (top); each layer should be a short label " +
      "and one supporting line, sized so the stack feels bottom-heavy.",
    format: "framework",
    tags: ["hierarchy", "framework"],
  },
];

export const ADS_STYLES: PromptStyle[] = [
  {
    id: "offer-snapshot",
    title: "Offer at-a-glance",
    summary: "One block — what it is, who it's for, what you get.",
    directive:
      "Compose the offer as a single bold block: a short headline naming the " +
      "offer, a one-line 'for whom' tag, and three tight bullet rows for " +
      "what's included; the block should feel dense but never crowded.",
    format: "snapshot",
    tags: ["snapshot", "intro"],
  },
  {
    id: "value-stack",
    title: "Stacked value bundle",
    summary: "Each component priced and totalled against an anchor.",
    directive:
      "Lay out the offer's components as a vertical stack of 4 to 7 named " +
      "rows, each row showing a placeholder dollar value; total the stack at " +
      "the bottom and contrast it against a single bold anchor price above.",
    format: "list",
    tags: ["value", "pricing"],
  },
  {
    id: "transformation-path",
    title: "Before → after path",
    summary: "Three beats from the customer's starting point to the result.",
    directive:
      "Frame the offer as a three-beat path from the customer's starting " +
      "frustration to the post-purchase result; middle beat names the offer " +
      "itself as the bridge, with short concrete language (no jargon).",
    format: "story",
    tags: ["transformation", "story"],
  },
  {
    id: "results-roadmap",
    title: "Results timeline",
    summary: "Week 1 / month 1 / month 3 milestones the buyer can expect.",
    directive:
      "Lay out the offer's expected outcomes as three labelled checkpoints " +
      "across a horizontal timeline (week 1, month 1, month 3); each " +
      "checkpoint lists 2 to 3 concrete, named results.",
    format: "process",
    tags: ["milestones", "expectations"],
  },
  {
    id: "method",
    title: "3-step method",
    summary: "A named framework reduced to exactly three steps.",
    directive:
      "Reduce the offer's method to exactly three named steps in a numbered " +
      "stack; each step is a verb-led phrase plus one supporting line, with " +
      "the offer name as the headline at the top.",
    format: "process",
    tags: ["method", "framework"],
  },
  {
    id: "who-its-for",
    title: "Audience fit grid",
    summary: "Three 'this is for you if…' rows that name the buyer.",
    directive:
      "Compose the offer as a three-row fit grid, each row opening with " +
      "'This is for you if…' followed by one specific named situation; " +
      "the goal is for the right reader to feel named.",
    format: "list",
    tags: ["audience", "fit"],
  },
  {
    id: "included-grid",
    title: "What's included grid",
    summary: "Six to nine named components the buyer receives.",
    directive:
      "Render the offer's included components as a 2x3 or 3x3 grid of " +
      "labelled tiles, each tile a single named item plus a one-line " +
      "description; the offer name and one-line summary sit at the top.",
    format: "list",
    tags: ["components", "grid"],
  },
  {
    id: "confidence",
    title: "Confidence section",
    summary: "Trust signals stacked — proof, guarantee, credentials.",
    directive:
      "Stack three to four confidence signals vertically (proof point, " +
      "guarantee, credential, social proof); each signal is a short phrase " +
      "in a consistent card style, stacked to feel weighty and reassuring.",
    format: "list",
    tags: ["trust", "proof"],
  },
];

export function stylesForTool(tool: "instant" | "ads"): PromptStyle[] {
  return tool === "instant" ? INSTANT_STYLES : ADS_STYLES;
}

export function findStyle(
  tool: "instant" | "ads",
  styleId: string
): PromptStyle | undefined {
  return stylesForTool(tool).find((s) => s.id === styleId);
}