import { describe, it, expect } from "vitest";
import { saveDraftSchema, updateDraftSchema, mediaItemSchema } from "@/lib/validation/drafts";
import { parseValue } from "@/lib/validation/helpers";

describe("validation/drafts - mediaItemSchema", () => {
  it("accepts a valid image item", () => {
    const result = parseValue(
      { id: "m1", url: "https://cdn.example.com/img.jpg", type: "image", name: "img.jpg" },
      mediaItemSchema
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.type).toBe("image");
  });

  it("defaults type to image when omitted", () => {
    const result = parseValue({ id: "m1", url: "https://x.com/i.jpg" }, mediaItemSchema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.type).toBe("image");
  });

  it("rejects invalid URL", () => {
    const result = parseValue({ id: "m1", url: "not-a-url" }, mediaItemSchema);
    expect(result.ok).toBe(false);
  });

  it("accepts empty url string (for in-progress drafts)", () => {
    const result = parseValue({ id: "m1", url: "" }, mediaItemSchema);
    expect(result.ok).toBe(true);
  });
});

describe("validation/drafts - saveDraftSchema", () => {
  it("accepts empty draft (creates new)", () => {
    const result = parseValue({}, saveDraftSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.caption).toBeUndefined();
      expect(result.data.platforms).toEqual([]);
      expect(result.data.mediaItems).toEqual([]);
      expect(result.data.tagUsers).toEqual([]);
    }
  });

  it("accepts a populated draft", () => {
    const result = parseValue(
      {
        id: "draft-123",
        caption: "wip",
        platforms: ["instagram", "tiktok"],
        mediaItems: [{ id: "m1", url: "https://cdn.x/y.jpg", type: "image" }],
        sameForAll: true,
        tagUsers: ["alice", "bob"],
      },
      saveDraftSchema
    );
    expect(result.ok).toBe(true);
  });

  it("rejects too many platforms", () => {
    const result = parseValue(
      { platforms: Array(10).fill("twitter") },
      saveDraftSchema
    );
    expect(result.ok).toBe(false);
  });

  it("rejects too many tagUsers", () => {
    const result = parseValue(
      { tagUsers: Array(51).fill("u") },
      saveDraftSchema
    );
    expect(result.ok).toBe(false);
  });
});

describe("validation/drafts - updateDraftSchema", () => {
  it("accepts partial updates", () => {
    const result = parseValue({ caption: "updated" }, updateDraftSchema);
    expect(result.ok).toBe(true);
  });
});