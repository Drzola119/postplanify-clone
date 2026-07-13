import { describe, it, expect } from "vitest";
import {
  hashtagSuggestionSchema,
  altTextSchema,
  sentimentSchema,
} from "@/lib/validation/ai";
import { parseValue } from "@/lib/validation/helpers";

describe("validation/ai - hashtagSuggestionSchema", () => {
  it("accepts a caption", () => {
    const r = parseValue({ caption: "Hello world" }, hashtagSuggestionSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.count).toBe(10);
  });

  it("rejects empty caption", () => {
    const r = parseValue({ caption: "" }, hashtagSuggestionSchema);
    expect(r.ok).toBe(false);
  });

  it("caps count at 30", () => {
    const r = parseValue({ caption: "hi", count: 50 }, hashtagSuggestionSchema);
    expect(r.ok).toBe(false);
  });

  it("rejects invalid platform", () => {
    const r = parseValue(
      { caption: "hi", platforms: ["mastodon"] },
      hashtagSuggestionSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/ai - altTextSchema", () => {
  it("accepts image URL", () => {
    const r = parseValue({ imageUrl: "https://x.com/i.jpg" }, altTextSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.tone).toBe("concise");
  });

  it("accepts data URI", () => {
    const r = parseValue({ imageUrl: "data:image/png;base64,iVBORw0KG" }, altTextSchema);
    expect(r.ok).toBe(true);
  });

  it("rejects invalid tone", () => {
    const r = parseValue({ imageUrl: "https://x.com/i.jpg", tone: "huh" }, altTextSchema);
    expect(r.ok).toBe(false);
  });
});

describe("validation/ai - sentimentSchema", () => {
  it("accepts a comment", () => {
    const r = parseValue({ text: "Love this!" }, sentimentSchema);
    expect(r.ok).toBe(true);
  });

  it("rejects empty text", () => {
    const r = parseValue({ text: "" }, sentimentSchema);
    expect(r.ok).toBe(false);
  });
});
