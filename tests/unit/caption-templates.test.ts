import { describe, it, expect } from "vitest";
import {
  buildCaptionPrompt,
  isVoice,
  isTemplate,
  VOICES,
  TEMPLATES,
  TEMPLATE_LABELS,
  VOICE_LABELS,
} from "@/lib/ai/caption-templates";

describe("caption-templates", () => {
  it("exposes a stable list of voices and templates", () => {
    expect(VOICES.length).toBeGreaterThan(5);
    expect(TEMPLATES).toContain("hook-insight-cta");
    expect(TEMPLATE_LABELS["hook-insight-cta"]).toBe("Hook → Insight → CTA");
    expect(VOICE_LABELS.b2b).toBe("B2B");
  });

  it("isVoice and isTemplate type guards", () => {
    expect(isVoice("b2b")).toBe(true);
    expect(isVoice("nope")).toBe(false);
    expect(isTemplate("pas")).toBe(true);
    expect(isTemplate("whatever")).toBe(false);
  });

  it("builds prompt with default voice and standard template when none provided", () => {
    const out = buildCaptionPrompt({
      tone: "default",
      includeHashtags: true,
      useEmojis: false,
      hasMedia: true,
    });
    expect(out.userPrompt).toMatch(/engaging/);
    expect(out.userPrompt).toMatch(/single cohesive/);
    expect(out.userPrompt).toMatch(/hashtags/);
    expect(out.systemPrompt).toMatch(/PostPlanify/);
  });

  it("applies the chosen voice hint to the user prompt", () => {
    const out = buildCaptionPrompt({
      tone: "ignored-when-voice-set",
      voice: "b2b",
      template: "standard",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(out.userPrompt).toMatch(/clear, value-led/);
    expect(out.userPrompt).toMatch(/Do NOT include hashtags/);
  });

  it("applies the chosen template instruction to the user prompt", () => {
    const pas = buildCaptionPrompt({
      tone: "default",
      template: "pas",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(pas.userPrompt).toMatch(/Problem → Agitate → Solve/);

    const listicle = buildCaptionPrompt({
      tone: "default",
      template: "listicle",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(listicle.userPrompt).toMatch(/numbered or bulleted/);

    const story = buildCaptionPrompt({
      tone: "default",
      template: "story",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(story.userPrompt).toMatch(/moment in time/);

    const hic = buildCaptionPrompt({
      tone: "default",
      template: "hook-insight-cta",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(hic.userPrompt).toMatch(/Open with a 1-line hook/);
  });

  it("clamps unknown voice/template to default/standard", () => {
    const out = buildCaptionPrompt({
      tone: "default",
      voice: "shouty",
      template: "weird",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    expect(out.userPrompt).toMatch(/engaging/);
    expect(out.userPrompt).toMatch(/single cohesive/);
  });

  it("includes platform char limits when provided", () => {
    const out = buildCaptionPrompt({
      tone: "default",
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
      platforms: [
        { id: "twitter", name: "X / Twitter", charLimit: 280 },
        { id: "linkedin", name: "LinkedIn", charLimit: 3000 },
      ],
    });
    expect(out.userPrompt).toMatch(/X \/ Twitter \(≤280 chars\)/);
    expect(out.userPrompt).toMatch(/LinkedIn \(≤3000 chars\)/);
  });

  it("truncates extra context to 400 chars", () => {
    const long = "x".repeat(2000);
    const out = buildCaptionPrompt({
      tone: "default",
      extra: long,
      includeHashtags: false,
      useEmojis: false,
      hasMedia: false,
    });
    // The clipped 400 'x' chars must appear but no more than that.
    expect(out.userPrompt).toMatch(/x{400}/);
    expect(out.userPrompt).not.toMatch(/x{500}/);
  });
});