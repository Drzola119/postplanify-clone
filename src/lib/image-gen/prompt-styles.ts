import "server-only";

/**
 * Infographic "style" catalogues that drive the Pick-a-layout panel on
 * `/dashboard/infographics/instant` and `/dashboard/infographics/ads`.
 *
 * Each entry's `directive` is the per-layout creative direction spliced into
 * the image-gen prompt by `prompt-builder.ts`. `format` is consumed by the
 * Ideogram helper to pick aspect-ratio defaults.
 *
 * Source of truth: the 30 Instant + 20 Ads prompt types lifted from
 * `actionactivated-clone/src/data/{infographics,ads}.ts`. Titles and
 * summaries are verbatim; the per-card `angle` (Instant) / `layout` (Ads)
 * becomes the `directive`.
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
    id: "roadmap-infographic",
    title: "Roadmap Infographic",
    summary:
      "Turns any topic or content into a beginner-to-advanced path with milestone momentum.",
    directive:
      "Build a clear transformation roadmap that moves the viewer from beginner confusion to confident understanding.",
    format: "process",
    tags: ["process", "framework"],
  },
  {
    id: "decision-tree-infographic",
    title: "Decision Tree Infographic",
    summary:
      "Creates a self-categorization visual where the viewer discovers their type.",
    directive:
      "Build an interactive decision tree that helps the viewer identify which type, stage, or situation they fit into.",
    format: "list",
    tags: ["list", "self-recognition"],
  },
  {
    id: "mistakes-infographic",
    title: "Mistakes Infographic",
    summary:
      "Reveals what people are doing wrong and why it keeps them stuck.",
    directive:
      "Build a mistake-driven diagnostic infographic that exposes the common errors holding people back.",
    format: "list",
    tags: ["list", "diagnosis"],
  },
  {
    id: "myth-vs-truth-infographic",
    title: "Myth vs Truth Infographic",
    summary:
      "Breaks false beliefs with sharp contrast and high curiosity.",
    directive:
      "Build a myth-versus-truth infographic that corrects false beliefs and replaces them with useful insight.",
    format: "comparison",
    tags: ["comparison", "contrarian"],
  },
  {
    id: "before-vs-after-infographic",
    title: "Before vs After Infographic",
    summary:
      "Makes the transformation visually obvious and emotionally easy to grasp.",
    directive:
      "Build a before-and-after transformation infographic that shows how thinking, behavior, or results change.",
    format: "comparison",
    tags: ["comparison", "transformation"],
  },
  {
    id: "checklist-infographic",
    title: "Checklist Infographic",
    summary:
      "Creates a practical save-worthy checklist people can use immediately.",
    directive:
      "Build a practical checklist infographic that gives the viewer clear things to fix, notice, apply, or avoid.",
    format: "list",
    tags: ["list", "saveable"],
  },
  {
    id: "cheat-sheet-infographic",
    title: "Cheat Sheet Infographic",
    summary:
      "Condenses expert knowledge into a shortcut-style visual asset.",
    directive:
      "Build a high-value cheat sheet infographic that makes the viewer feel like they received a shortcut.",
    format: "list",
    tags: ["list", "shortcut"],
  },
  {
    id: "warning-signs-infographic",
    title: "Warning Signs Infographic",
    summary:
      "Creates self-diagnosis through signs, signals, and hidden patterns.",
    directive:
      "Build a warning-signs infographic that helps the viewer recognize hidden patterns in themselves or their situation.",
    format: "list",
    tags: ["list", "diagnosis"],
  },
  {
    id: "framework-infographic",
    title: "Framework Infographic",
    summary:
      "Turns any keyword or content into a named system that feels premium and teachable.",
    directive:
      "Build a named framework infographic that organizes the topic into a simple, memorable system.",
    format: "framework",
    tags: ["framework", "mental-model"],
  },
  {
    id: "pyramid-infographic",
    title: "Pyramid Infographic",
    summary:
      "Uses hierarchy to make information feel organized and authoritative.",
    directive:
      "Build a pyramid infographic that stacks the most important ideas from foundation to peak.",
    format: "framework",
    tags: ["framework", "hierarchy"],
  },
  {
    id: "cycle-infographic",
    title: "Cycle Infographic",
    summary:
      "Shows the loop that keeps a pattern repeating.",
    directive:
      "Build a cycle infographic that shows how the pattern repeats, what feeds it, and where to interrupt it.",
    format: "process",
    tags: ["process", "loop"],
  },
  {
    id: "flowchart-infographic",
    title: "Flowchart Infographic",
    summary:
      "Creates an if-this-then-that path that pulls the viewer through the graphic.",
    directive:
      "Build a flowchart infographic that tells the viewer what to do depending on their situation.",
    format: "process",
    tags: ["process", "decision"],
  },
  {
    id: "comparison-infographic",
    title: "Comparison Infographic",
    summary:
      "Compares two approaches, identities, beliefs, or outcomes for instant clarity.",
    directive:
      "Build a comparison infographic that contrasts the old way with the better way.",
    format: "comparison",
    tags: ["comparison", "contrast"],
  },
  {
    id: "anatomy-infographic",
    title: "Anatomy Infographic",
    summary:
      "Breaks the topic into parts so abstract ideas feel concrete.",
    directive:
      "Build an anatomy-style infographic that labels the key parts, layers, or components of the topic.",
    format: "snapshot",
    tags: ["snapshot", "labels"],
  },
  {
    id: "timeline-infographic",
    title: "Timeline Infographic",
    summary:
      "Shows how the topic unfolds across time, stages, or milestones.",
    directive:
      "Build a timeline infographic that shows what happens across time when someone engages with the topic.",
    format: "process",
    tags: ["process", "story"],
  },
  {
    id: "levels-infographic",
    title: "Levels Infographic",
    summary:
      "Creates stages that make viewers ask, what level am I on?",
    directive:
      "Build a levels infographic that ranks stages of awareness, skill, danger, maturity, or transformation.",
    format: "snapshot",
    tags: ["snapshot", "stages"],
  },
  {
    id: "dos-and-donts-infographic",
    title: "Dos and Don'ts Infographic",
    summary:
      "Gives fast correction through simple contrast and action clarity.",
    directive:
      "Build a do-this-not-that infographic that gives fast, useful correction.",
    format: "comparison",
    tags: ["comparison", "correction"],
  },
  {
    id: "problem-to-solution-infographic",
    title: "Problem to Solution Infographic",
    summary:
      "Maps pain, cause, fix, and outcome for conversion-friendly clarity.",
    directive:
      "Build a problem-to-solution infographic that moves from pain to cause to fix to better outcome.",
    format: "process",
    tags: ["process", "story"],
  },
  {
    id: "identity-archetype-infographic",
    title: "Identity Archetype Infographic",
    summary:
      "Creates shareable personality or behavior types around any topic.",
    directive:
      "Build an archetype infographic that groups viewers into memorable identity-based types.",
    format: "list",
    tags: ["list", "identity"],
  },
  {
    id: "contrarian-truth-infographic",
    title: "Contrarian Truth Infographic",
    summary:
      "Stops the scroll by saying the opposite of what people expect.",
    directive:
      "Build a contrarian truth infographic that reveals what people get wrong and reframes the topic sharply.",
    format: "comparison",
    tags: ["comparison", "contrarian"],
  },
  {
    id: "symptoms-infographic",
    title: "Symptoms Infographic",
    summary:
      "Shows what the problem looks and feels like in real life.",
    directive:
      "Build a symptoms infographic that helps the viewer recognize the real-life signs of the issue.",
    format: "list",
    tags: ["list", "diagnosis"],
  },
  {
    id: "root-cause-infographic",
    title: "Root Cause Infographic",
    summary:
      "Reveals what is beneath the surface and why the issue keeps happening.",
    directive:
      "Build a root-cause infographic that explains the deeper drivers behind the visible problem.",
    format: "list",
    tags: ["list", "depth"],
  },
  {
    id: "iceberg-infographic",
    title: "Iceberg Infographic",
    summary:
      "Shows surface-level symptoms versus hidden deeper causes.",
    directive:
      "Build an iceberg infographic that separates what people see from what is really happening underneath.",
    format: "framework",
    tags: ["framework", "depth"],
  },
  {
    id: "ladder-infographic",
    title: "Ladder Infographic",
    summary:
      "Creates upward movement through upgrades, steps, or progressions.",
    directive:
      "Build a ladder infographic that shows the viewer how to climb from stuck to stronger, smarter, or more skilled.",
    format: "framework",
    tags: ["framework", "progression"],
  },
  {
    id: "map-infographic",
    title: "Map Infographic",
    summary:
      "Turns the topic into a territory with zones, obstacles, and destinations.",
    directive:
      "Build a map-style infographic that shows where the viewer is, what blocks them, and where to go next.",
    format: "list",
    tags: ["list", "navigation"],
  },
  {
    id: "scorecard-infographic",
    title: "Scorecard Infographic",
    summary:
      "Lets viewers grade themselves and discover hidden gaps.",
    directive:
      "Build a scorecard infographic that lets the viewer rate themselves and identify what needs improvement.",
    format: "snapshot",
    tags: ["snapshot", "self-recognition"],
  },
  {
    id: "spectrum-infographic",
    title: "Spectrum Infographic",
    summary:
      "Shows a range from weak to strong, chaotic to stable, or beginner to advanced.",
    directive:
      "Build a spectrum infographic that helps the viewer place themselves on a range.",
    format: "comparison",
    tags: ["comparison", "range"],
  },
  {
    id: "formula-infographic",
    title: "Formula Infographic",
    summary:
      "Turns the topic into a simple equation that feels smart and memorable.",
    directive:
      "Build a formula infographic that explains the topic through a simple, memorable equation.",
    format: "snapshot",
    tags: ["snapshot", "mental-model"],
  },
  {
    id: "matrix-infographic",
    title: "Matrix Infographic",
    summary:
      "Uses a 2x2 grid to sort actions, people, problems, or strategies.",
    directive:
      "Build a matrix infographic that sorts the topic into four useful categories.",
    format: "snapshot",
    tags: ["snapshot", "grid"],
  },
  {
    id: "survival-guide-infographic",
    title: "Survival Guide Infographic",
    summary:
      "Helps the viewer handle a difficult situation with calm and clarity.",
    directive:
      "Build a survival guide infographic that shows what to do when the topic becomes hard, confusing, or overwhelming.",
    format: "list",
    tags: ["list", "support"],
  },
];

export const ADS_STYLES: PromptStyle[] = [
  {
    id: "offer-snapshot-infographic",
    title: "Offer Snapshot Infographic",
    summary:
      "Locks ChatGPT into a clean overview layout for what the offer is, who it helps, what buyers get, and the main outcome.",
    directive:
      "Use a bold offer-title headline, a short promise subtitle, four labeled snapshot blocks: What It Is, Who It Helps, What You Get, and Main Outcome, plus a bottom proof/value strip and centered footer CTA.",
    format: "snapshot",
    tags: ["snapshot", "intro"],
  },
  {
    id: "whats-included-infographic",
    title: "What's Included Infographic",
    summary:
      "Sets up a deliverable-card visual that makes the offer feel tangible and complete.",
    directive:
      "Use a bold headline, a short value subtitle, and a grid or stacked set of included-item cards. Each card should show a real deliverable, asset, module, bonus, prompt, lesson, training, resource, or tool from the sales copy, plus what it helps the buyer do. End with the centered footer CTA.",
    format: "list",
    tags: ["list", "components"],
  },
  {
    id: "value-stack-infographic",
    title: "Value Stack Infographic",
    summary:
      "Frames the offer as a layered stack of assets, bonuses, proof points, and value drivers.",
    directive:
      "Use a vertical stack of value layers. Each layer should be a real asset, feature, deliverable, bonus, mechanism, proof point, or value point from the sales copy. Include a bottom complete-package strip and centered footer CTA.",
    format: "list",
    tags: ["list", "value"],
  },
  {
    id: "transformation-path-infographic",
    title: "Transformation Path Infographic",
    summary:
      "Sets up a journey-style visual that shows the positive path the buyer takes through the offer.",
    directive:
      "Use a top-to-bottom or left-to-right path with 4 to 6 transformation milestones. Each milestone should show what the buyer receives, does, experiences, creates, or gains from the offer. End with the main buyer outcome and centered footer CTA.",
    format: "process",
    tags: ["process", "story"],
  },
  {
    id: "results-roadmap-infographic",
    title: "Results Roadmap Infographic",
    summary:
      "Creates a roadmap layout that connects offer components to progress and results.",
    directive:
      "Use a numbered roadmap with 3 to 6 checkpoints. Each checkpoint should connect a real offer component, feature, module, tool, step, or deliverable to the result it supports. End with a result-focused payoff strip and centered footer CTA.",
    format: "process",
    tags: ["process", "milestones"],
  },
  {
    id: "method-infographic",
    title: "Method Infographic",
    summary:
      "Turns the offer's unique mechanism into a proprietary-feeling method or framework visual.",
    directive:
      "Use the offer name or extracted method in the center, with 4 to 6 surrounding pillars. Each pillar must represent a real part of the offer mechanism, process, system, or promise. End with a proof/value strip and centered footer CTA.",
    format: "framework",
    tags: ["framework", "method"],
  },
  {
    id: "3-step-system-infographic",
    title: "3-Step System Infographic",
    summary:
      "Makes the offer feel simple by reducing it into three clear usage steps.",
    directive:
      "Use exactly three large numbered sections labeled Step 1, Step 2, and Step 3. Step 1 should be the starting action, Step 2 the core offer mechanism or process, and Step 3 the output or result. Use only offer-specific details. End with centered footer CTA.",
    format: "process",
    tags: ["process", "framework"],
  },
  {
    id: "feature-to-benefit-infographic",
    title: "Feature to Benefit Infographic",
    summary:
      "Creates paired rows that show what buyers get and why each piece matters.",
    directive:
      "Use paired feature-to-benefit rows or cards. Left side: real features, assets, modules, prompts, tools, dashboards, lessons, templates, resources, or deliverables from the offer. Right side: the specific buyer benefit each one creates. Use arrows or connectors. End with centered footer CTA.",
    format: "comparison",
    tags: ["comparison", "value"],
  },
  {
    id: "benefit-cluster-infographic",
    title: "Benefit Cluster Infographic",
    summary:
      "Groups the offer's strongest benefits into clean categories.",
    directive:
      "Use 3 to 5 benefit clusters. Each cluster should have a category label and 1 to 3 short bullets based on the offer promise, mechanism, deliverables, proof points, or outcome. End with a bottom payoff strip and centered footer CTA.",
    format: "list",
    tags: ["list", "value"],
  },
  {
    id: "outcome-map-infographic",
    title: "Outcome Map Infographic",
    summary:
      "Maps offer components to the outcomes they help create.",
    directive:
      "Use a map-style layout with offer components as nodes connected to outcomes. Each node must show a real deliverable, mechanism, feature, or asset from the sales copy and the result it supports. End at the main buyer outcome and centered footer CTA.",
    format: "list",
    tags: ["list", "outcomes"],
  },
  {
    id: "buyer-experience-infographic",
    title: "Buyer Experience Infographic",
    summary:
      "Shows what happens after someone gets the offer, making the purchase feel safe and predictable.",
    directive:
      "Use a chronological buyer-experience flow with 4 to 6 stages. Each stage should show what the buyer sees, receives, does, creates, uses, or gains after getting the offer. Add a bottom confidence note and centered footer CTA.",
    format: "process",
    tags: ["process", "confidence"],
  },
  {
    id: "fast-start-infographic",
    title: "Fast Start Infographic",
    summary:
      "Highlights how easy it is to begin using the offer right away.",
    directive:
      "Use a quick-start sequence with 3 to 5 immediate actions. Each action must come from the real offer process, dashboard, prompt, training, tool, resource, module, or deliverable. Show the immediate output or benefit. End with centered footer CTA.",
    format: "process",
    tags: ["process", "quick-start"],
  },
  {
    id: "quick-win-infographic",
    title: "Quick Win Infographic",
    summary:
      "Spotlights the first useful result the buyer can get from the offer.",
    directive:
      "Use a quick-win spotlight layout. Name the first useful win, then show 3 to 5 supporting offer-specific assets, steps, features, or deliverables that create that win. Add a result callout and centered footer CTA.",
    format: "list",
    tags: ["list", "quick-start"],
  },
  {
    id: "implementation-plan-infographic",
    title: "Implementation Plan Infographic",
    summary:
      "Turns the offer into a practical use plan instead of something to merely consume.",
    directive:
      "Use phases such as Start, Use, Apply, Improve, and Repeat, or a similar offer-specific sequence. Each phase should show a real action the buyer takes with the offer and the output it creates. End with the centered footer CTA.",
    format: "process",
    tags: ["process", "phases"],
  },
  {
    id: "tool-kit-infographic",
    title: "Tool Kit Infographic",
    summary:
      "Frames the offer as a practical set of tools, assets, prompts, trainings, or resources.",
    directive:
      "Use a toolkit, toolbox, or asset-grid layout. Each tool must be a real prompt, template, training, converter, dashboard, lesson, bonus, resource, feature, or asset from the offer. Each tool should show what it helps the buyer create, fix, speed up, simplify, or improve. End with centered footer CTA.",
    format: "list",
    tags: ["list", "tools"],
  },
  {
    id: "offer-ecosystem-infographic",
    title: "Offer Ecosystem Infographic",
    summary:
      "Shows how all pieces of the offer work together as one complete system.",
    directive:
      "Use a hub-and-spoke ecosystem layout. Put the offer name in the center. Surround it with connected spokes for the main deliverables, bonuses, tools, prompts, trainings, systems, assets, or proof points. Each spoke should show how that part supports the buyer outcome. End with centered footer CTA.",
    format: "framework",
    tags: ["framework", "system"],
  },
  {
    id: "module-map-infographic",
    title: "Module Map Infographic",
    summary:
      "Maps the inside structure of the offer into modules, sections, or deliverable cards.",
    directive:
      "Use a module-map or section-grid layout. Each card must show a real module, prompt set, converter, lesson, section, resource, offer part, or deliverable from the sales copy, plus a short purpose or outcome label. End with centered footer CTA.",
    format: "list",
    tags: ["list", "structure"],
  },
  {
    id: "use-case-infographic",
    title: "Use Case Infographic",
    summary:
      "Shows different practical ways the buyer can use the offer.",
    directive:
      "Use 4 to 6 use-case cards. Each card should show who would use the offer, what they would use it for, and the result it supports. Use only use cases that logically come from the sales copy or offer description. End with centered footer CTA.",
    format: "list",
    tags: ["list", "audience"],
  },
  {
    id: "who-it-helps-infographic",
    title: "Who It Helps Infographic",
    summary:
      "Clarifies the best-fit buyers in a positive, self-recognition layout.",
    directive:
      "Use 4 to 6 positive audience-fit cards. Each card must identify a buyer type from the sales copy and what that person wants to accomplish. Do not use negative exclusion framing. Add a self-recognition line and centered footer CTA.",
    format: "list",
    tags: ["list", "audience"],
  },
  {
    id: "purchase-confidence-infographic",
    title: "Purchase Confidence Infographic",
    summary:
      "Builds buyer confidence through clarity, proof, simplicity, value, and next step.",
    directive:
      "Use 4 to 6 confidence sections such as Clear Promise, Simple Process, Included Deliverables, Proof Points, Easy Start, and Next Step. Each section must use details extracted from the sales copy. End with the centered footer CTA.",
    format: "list",
    tags: ["list", "trust"],
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
