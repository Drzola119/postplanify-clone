/**
 * Brand-voice tones and caption templates for the AI caption generator.
 *
 * Both `voice` and `template` are referenced by string id from the client.
 * The shapes here are pure data so they can be unit tested without Groq.
 */

export const VOICES = ["default", "friendly", "funny", "bold", "professional", "motivational", "lifestyle", "b2b", "founder", "ecommerce"] as const;
export type Voice = (typeof VOICES)[number];

export const TEMPLATES = ["standard", "hook-insight-cta", "pas", "listicle", "story"] as const;
export type CaptionTemplate = (typeof TEMPLATES)[number];

const VOICE_HINT: Record<Voice, string> = {
  default: "engaging, balanced",
  friendly: "warm, conversational, first-person",
  funny: "witty, playful, light humor",
  bold: "punchy, confident, energetic",
  professional: "polished, authoritative",
  motivational: "uplifting, inspiring, action-oriented",
  lifestyle: "aspirational, sensory, emotionally resonant",
  b2b: "clear, value-led, outcome-focused, no fluff",
  founder: "honest, vulnerable, behind-the-scenes",
  ecommerce: "benefit-driven, urgent, social proof",
};

const TEMPLATE_INSTRUCTIONS: Record<CaptionTemplate, string> = {
  standard: "Write a single cohesive caption.",
  "hook-insight-cta":
    "Open with a 1-line hook that earns the scroll. Then 2–4 lines of insight or value. Close with a clear call to action.",
  pas: "Use the Problem → Agitate → Solve arc. Name the pain, intensify it, then present the fix.",
  listicle: "Use a numbered or bulleted list (3–6 items). Each item is a short, concrete benefit or takeaway.",
  story: "Open with a moment in time. Then a brief setup, a turn, and a takeaway the reader can apply.",
};

const MAX_EXTRA_LEN = 400;

export function isVoice(v: unknown): v is Voice {
  return typeof v === "string" && (VOICES as readonly string[]).includes(v);
}

export function isTemplate(t: unknown): t is CaptionTemplate {
  return typeof t === "string" && (TEMPLATES as readonly string[]).includes(t);
}

export interface PromptInput {
  tone: string;
  voice?: string | null;
  template?: string | null;
  includeHashtags: boolean;
  useEmojis: boolean;
  extra?: string | null;
  platforms?: { id: string; name: string; charLimit: number }[];
  hasMedia: boolean;
}

export interface PromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

export function buildCaptionPrompt(input: PromptInput): PromptOutput {
  const voice: Voice = isVoice(input.voice) ? input.voice : "default";
  const tpl: CaptionTemplate = isTemplate(input.template) ? input.template : "standard";

  const toneHint = VOICE_HINT[voice];
  const tplHint = TEMPLATE_INSTRUCTIONS[tpl];

  const tags = input.includeHashtags ? "End with 3–6 relevant hashtags on their own line." : "Do NOT include hashtags.";
  const emo = input.useEmojis ? "Sprinkle 2–5 fitting emojis throughout the caption." : "Do NOT use emojis.";

  const platformHint =
    input.platforms && input.platforms.length > 0
      ? `Target platforms: ${input.platforms.map((p) => `${p.name} (≤${p.charLimit} chars)`).join(", ")}.`
      : "Target multiple social platforms; keep the caption under 2200 chars.";

  const extra = input.extra?.trim() ? `\nAdditional context from the user: ${input.extra.trim().slice(0, MAX_EXTRA_LEN)}` : "";

  const mediaLine = input.hasMedia
    ? "Describe what's in the attached media, then frame it for the target audience."
    : "No media attached — infer a likely subject from the tone + platform + extra context.";

  const userPrompt = [
    `Write a social caption in a ${toneHint} voice.`,
    `Structure: ${tplHint}`,
    platformHint,
    tags,
    emo,
    mediaLine,
    extra,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    systemPrompt:
      "You are a social-media copywriter for PostPlanify. " +
      "Write captions that are ready to paste — no preamble, no quotes, no 'Here is your caption:'. " +
      "Never start with 'I', never reference the prompt. " +
      "Use line breaks (\\n\\n) to separate paragraphs. " +
      "Return ONLY the caption text.",
    userPrompt,
  };
}

export const TEMPLATE_LABELS: Record<CaptionTemplate, string> = {
  standard: "Standard",
  "hook-insight-cta": "Hook → Insight → CTA",
  pas: "Problem → Agitate → Solve",
  listicle: "Listicle",
  story: "Story",
};

export const VOICE_LABELS: Record<Voice, string> = {
  default: "Default",
  friendly: "Friendly",
  funny: "Funny",
  bold: "Bold",
  professional: "Professional",
  motivational: "Motivational",
  lifestyle: "Lifestyle",
  b2b: "B2B",
  founder: "Founder",
  ecommerce: "E-commerce",
};