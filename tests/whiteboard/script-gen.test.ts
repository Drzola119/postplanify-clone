/**
 * tests/whiteboard/script-gen.test.ts
 * Verifies phase timing arithmetic and the narration instruction that gives
 * the rendered clips audio without any TTS step.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WhiteboardRequest } from "@/lib/validation/video-gen";

const callGroq = vi.fn();

vi.mock("@/lib/ai/groq", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/groq")>();
  return { ...actual, callGroq };
});

const { generateWhiteboardScript, phaseLabelsFor } = await import(
  "@/lib/video-gen/whiteboard/script-gen"
);
const { resolveClipSpec } = await import("@/lib/video-gen/whiteboard/clip-matrix");

const request: WhiteboardRequest = {
  workflow: "whiteboard",
  provider: "auto",
  styleId: "whiteboard-default",
  aspectRatios: ["9:16"],
  topic: "Why cold email still outperforms ads",
  mood: "professional",
  language: "en",
  durationSec: 30,
  aspectRatio: "9:16",
  qualityPreference: "quality",
};

function groqPhases(count: number) {
  return JSON.stringify({
    phases: Array.from({ length: count }, (_, i) => ({
      voiceover: `Spoken line number ${i + 1}.`,
      onScreenText: `BOLD ${i + 1}`,
      visualDirection: `A hand sketches diagram ${i + 1}.`,
    })),
  });
}

beforeEach(() => {
  callGroq.mockReset();
});

describe("phaseLabelsFor", () => {
  it("uses the known narrative arc for supported clip counts", () => {
    expect(phaseLabelsFor(3)).toEqual(["Hook", "Value", "CTA"]);
    expect(phaseLabelsFor(6)).toHaveLength(6);
    expect(phaseLabelsFor(12)[11]).toBe("CTA");
  });

  it("falls back to generic labels for unmapped counts", () => {
    expect(phaseLabelsFor(5)).toEqual(["Part 1", "Part 2", "Part 3", "Part 4", "Part 5"]);
  });
});

describe("generateWhiteboardScript", () => {
  it("populates timing from the clip spec", async () => {
    const clipSpec = resolveClipSpec("veo-3.1", 30); // 3 x 10s
    callGroq.mockResolvedValue({ content: groqPhases(3), model: "test" });

    const script = await generateWhiteboardScript(request, clipSpec, "test-key");

    expect(script.clipCount).toBe(3);
    expect(script.clipDurationSec).toBe(10);
    expect(script.totalSec).toBe(30);
    expect(script.topic).toBe(request.topic);
    expect(script.phases.map((p) => [p.index, p.startSec, p.endSec])).toEqual([
      [0, 0, 10],
      [1, 10, 20],
      [2, 20, 30],
    ]);
    expect(script.phases.every((p) => p.durationSec === 10)).toBe(true);
    expect(script.phases.map((p) => p.label)).toEqual(["Hook", "Value", "CTA"]);
  });

  it("round-trips voiceover and on-screen text from the model output", async () => {
    const clipSpec = resolveClipSpec("veo-3.1", 30);
    callGroq.mockResolvedValue({ content: groqPhases(3), model: "test" });

    const script = await generateWhiteboardScript(request, clipSpec, "test-key");

    expect(script.phases[0].voiceover).toBe("Spoken line number 1.");
    expect(script.phases[0].onScreenText).toBe("BOLD 1");
    expect(script.phases[1].visualDirection).toContain("A hand sketches diagram 2.");
  });

  it("embeds the spoken-narration instruction in every visual direction", async () => {
    const clipSpec = resolveClipSpec("seedance-2-fast", 30); // 6 x 5s
    callGroq.mockResolvedValue({ content: groqPhases(6), model: "test" });

    const script = await generateWhiteboardScript(request, clipSpec, "test-key");

    expect(script.phases).toHaveLength(6);
    for (const phase of script.phases) {
      expect(phase.visualDirection).toContain("narrates aloud in English");
      expect(phase.visualDirection).toContain(phase.voiceover);
      expect(phase.visualDirection).toMatch(/no subtitles or captions/i);
    }
  });

  it("uses the requested language in the narration instruction", async () => {
    const clipSpec = resolveClipSpec("veo-3.1", 30);
    callGroq.mockResolvedValue({ content: groqPhases(3), model: "test" });

    const script = await generateWhiteboardScript(
      { ...request, language: "fr" },
      clipSpec,
      "test-key"
    );

    expect(script.phases[0].visualDirection).toContain("narrates aloud in French");
  });

  it("throws when the model returns fewer phases than clips", async () => {
    const clipSpec = resolveClipSpec("seedance-2-fast", 30);
    callGroq.mockResolvedValue({ content: groqPhases(2), model: "test" });

    await expect(generateWhiteboardScript(request, clipSpec, "test-key")).rejects.toThrow(
      /expected 6/
    );
  });

  it("requests JSON mode from Groq", async () => {
    const clipSpec = resolveClipSpec("veo-3.1", 30);
    callGroq.mockResolvedValue({ content: groqPhases(3), model: "test" });

    await generateWhiteboardScript(request, clipSpec, "test-key");

    expect(callGroq).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "test-key", jsonMode: true })
    );
  });
});
