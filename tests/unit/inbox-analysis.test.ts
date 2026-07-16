import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/log", () => ({
  createLogger: () => ({
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  }),
}));

const { callGroqMock } = vi.hoisted(() => ({ callGroqMock: vi.fn() }));

vi.mock("@/lib/ai/groq", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/groq")>("@/lib/ai/groq");
  return {
    ...actual,
    callGroq: callGroqMock,
  };
});

import { analyzeInboxMessage } from "@/lib/ai/inbox-analysis";

beforeEach(() => {
  callGroqMock.mockReset();
});

describe("ai/inbox-analysis - analyzeInboxMessage", () => {
  it("maps valid LLM JSON to typed enum result", async () => {
    callGroqMock.mockResolvedValueOnce({
      content: JSON.stringify({ sentiment: "positive", intent: "sales", topics: ["Pricing", "Plan", "DEMO"] }),
      model: "test",
    });
    const r = await analyzeInboxMessage(
      { platform: "instagram", body: "How much?", authorHandle: "u" },
      "test-key",
    );
    expect(r).toEqual({
      sentiment: "positive",
      intent: "sales",
      topics: ["pricing", "plan", "demo"],
    });
  });

  it("falls back to 'neutral' + 'other' when LLM returns unknown values", async () => {
    callGroqMock.mockResolvedValueOnce({
      content: JSON.stringify({ sentiment: "ecstatic", intent: "chitchat", topics: [] }),
      model: "test",
    });
    const r = await analyzeInboxMessage(
      { platform: "twitter", body: "hi", authorHandle: "u" },
      "test-key",
    );
    expect(r?.sentiment).toBe("neutral");
    expect(r?.intent).toBe("other");
    expect(r?.topics).toEqual([]);
  });

  it("returns null on empty body", async () => {
    const r = await analyzeInboxMessage(
      { platform: "twitter", body: "   ", authorHandle: "u" },
      "test-key",
    );
    expect(r).toBeNull();
    expect(callGroqMock).not.toHaveBeenCalled();
  });

  it("returns null when LLM returns non-JSON", async () => {
    callGroqMock.mockResolvedValueOnce({ content: "I think this is positive.", model: "test" });
    const r = await analyzeInboxMessage(
      { platform: "twitter", body: "hi", authorHandle: "u" },
      "test-key",
    );
    expect(r).toBeNull();
  });

  it("returns null when callGroq throws", async () => {
    callGroqMock.mockRejectedValueOnce(new Error("network"));
    const r = await analyzeInboxMessage(
      { platform: "twitter", body: "hi", authorHandle: "u" },
      "test-key",
    );
    expect(r).toBeNull();
  });

  it("sanitizes topics: lowercases, strips punctuation, limits to 5", async () => {
    callGroqMock.mockResolvedValueOnce({
      content: JSON.stringify({
        sentiment: "neutral",
        intent: "feedback",
        topics: ["PRICING!", "free-trial", "", "  ?? ", "a-very-long-topic-tag-here-that-is-over-thirty-two-chars"],
      }),
      model: "test",
    });
    const r = await analyzeInboxMessage(
      { platform: "linkedin", body: "feedback here", authorHandle: "u" },
      "test-key",
    );
    expect(r?.topics.length).toBeLessThanOrEqual(5);
    expect(r?.topics).toContain("pricing");
    expect(r?.topics).toContain("free-trial");
  });
});