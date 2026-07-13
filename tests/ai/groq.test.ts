import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callGroq, extractJson, GroqError } from "@/lib/ai/groq";

describe("ai/groq - extractJson", () => {
  it("parses bare JSON", () => {
    expect(extractJson<{ x: number }>('{"x": 1}')).toEqual({ x: 1 });
  });

  it("parses fenced JSON", () => {
    expect(extractJson<{ x: number }>('```json\n{"x": 2}\n```')).toEqual({ x: 2 });
  });

  it("handles prose around JSON", () => {
    expect(extractJson<{ x: number }>('Here you go: {"x": 3} - done!')).toEqual({ x: 3 });
  });

  it("returns null on bad input", () => {
    expect(extractJson("not json at all")).toBeNull();
    expect(extractJson("")).toBeNull();
  });
});

describe("ai/groq - callGroq", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns content on success", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "hello" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const r = await callGroq({
      apiKey: "test-key",
      model: "test",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(r.content).toBe("hello");
  });

  it("throws GroqError on non-2xx", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ error: { message: "rate limited" } }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    await expect(
      callGroq({ apiKey: "k", model: "m", messages: [{ role: "user", content: "hi" }] })
    ).rejects.toBeInstanceOf(GroqError);
  });

  it("throws GroqError on empty content", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "   " } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    await expect(
      callGroq({ apiKey: "k", model: "m", messages: [{ role: "user", content: "hi" }] })
    ).rejects.toBeInstanceOf(GroqError);
  });
});
