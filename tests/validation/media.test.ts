import { describe, it, expect } from "vitest";
import {
  mediaAssetSchema,
  createMediaAssetSchema,
  mediaAssetListFiltersSchema,
} from "@/lib/validation/media";
import { parseValue, parseSearchParams } from "@/lib/validation/helpers";

describe("validation/media - mediaAssetSchema", () => {
  it("accepts a valid image asset", () => {
    const r = parseValue(
      {
        url: "https://cdn.example.com/img.jpg",
        storedPath: "user/assets/123_img.jpg",
        mime: "image/jpeg",
        size: 1024,
        folder: "assets",
      },
      mediaAssetSchema
    );
    expect(r.ok).toBe(true);
  });

  it("accepts a video with duration", () => {
    const r = parseValue(
      {
        url: "https://cdn.example.com/v.mp4",
        storedPath: "user/posts/v.mp4",
        mime: "video/mp4",
        size: 5_000_000,
        duration: 12.5,
        folder: "posts",
      },
      mediaAssetSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects non-http URL", () => {
    const r = parseValue(
      {
        url: "not-a-url",
        storedPath: "x",
        mime: "image/png",
        size: 10,
        folder: "assets",
      },
      mediaAssetSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects unknown folder", () => {
    const r = parseValue(
      {
        url: "https://x.com/i.jpg",
        storedPath: "x",
        mime: "image/jpeg",
        size: 10,
        folder: "secret",
      },
      mediaAssetSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/media - createMediaAssetSchema", () => {
  it("accepts and applies default tags", () => {
    const r = parseValue(
      {
        url: "https://cdn.example.com/x.jpg",
        storedPath: "user/assets/x.jpg",
        mime: "image/jpeg",
        size: 100,
        folder: "avatars",
      },
      createMediaAssetSchema
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.tags).toEqual([]);
  });

  it("rejects oversized file", () => {
    const r = parseValue(
      {
        url: "https://cdn.example.com/big.jpg",
        storedPath: "user/assets/big.jpg",
        mime: "image/jpeg",
        size: 300 * 1024 * 1024,
        folder: "assets",
      },
      createMediaAssetSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/media - mediaAssetListFiltersSchema", () => {
  it("defaults pageSize", () => {
    const r = parseSearchParams(new URLSearchParams(""), mediaAssetListFiltersSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pageSize).toBe(25);
  });

  it("filters by folder", () => {
    const r = parseSearchParams(new URLSearchParams("folder=avatars"), mediaAssetListFiltersSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.folder).toBe("avatars");
  });
});
