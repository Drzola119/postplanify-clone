import { describe, it, expect } from "vitest";
import { parseCsv, normalizePlatforms, normalizeHashtags } from "@/lib/bulk-schedule/csv";

describe("bulk-schedule/csv.ts - parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    const text = "caption,platforms\nHello,instagram\nWorld,twitter";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["caption", "platforms"]);
    expect(rows).toEqual([
      ["Hello", "instagram"],
      ["World", "twitter"],
    ]);
  });

  it("strips UTF-8 BOM from the first header", () => {
    const text = "﻿caption,platforms\nHello,instagram";
    const { headers } = parseCsv(text);
    expect(headers).toEqual(["caption", "platforms"]);
  });

  it("supports quoted fields with embedded commas", () => {
    const text = 'caption,platforms\n"Hello, world",instagram';
    const { rows } = parseCsv(text);
    expect(rows).toEqual([["Hello, world", "instagram"]]);
  });

  it("supports quoted fields with embedded newlines", () => {
    const text = 'caption,platforms\n"Line 1\nLine 2",instagram';
    const { rows } = parseCsv(text);
    expect(rows).toEqual([["Line 1\nLine 2", "instagram"]]);
  });

  it("supports \"\" escapes inside quoted fields", () => {
    const text = 'caption,platforms\n"He said ""hi""",instagram';
    const { rows } = parseCsv(text);
    expect(rows).toEqual([['He said "hi"', "instagram"]]);
  });

  it("handles CRLF line endings", () => {
    const text = "caption,platforms\r\nHello,instagram\r\nWorld,twitter\r\n";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["caption", "platforms"]);
    expect(rows).toEqual([
      ["Hello", "instagram"],
      ["World", "twitter"],
    ]);
  });

  it("handles LF line endings", () => {
    const text = "caption,platforms\nHello,instagram\nWorld,twitter\n";
    const { rows } = parseCsv(text);
    expect(rows).toEqual([
      ["Hello", "instagram"],
      ["World", "twitter"],
    ]);
  });

  it("trims header whitespace and lowercases", () => {
    const text = "  Caption , PLATFORMS \nHello,instagram";
    const { headers } = parseCsv(text);
    expect(headers).toEqual(["caption", "platforms"]);
  });

  it("filters out fully-empty rows", () => {
    const text = "caption,platforms\nHello,instagram\n,\nWorld,twitter";
    const { rows } = parseCsv(text);
    expect(rows).toEqual([
      ["Hello", "instagram"],
      ["World", "twitter"],
    ]);
  });

  it("returns empty headers for empty input", () => {
    const { headers, rows } = parseCsv("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("treats a header-only file as empty rows", () => {
    const { headers, rows } = parseCsv("caption,platforms");
    expect(headers).toEqual(["caption", "platforms"]);
    expect(rows).toEqual([]);
  });

  it("preserves empty fields", () => {
    const text = "caption,platforms,mediaUrl\nHello,instagram,";
    const { rows } = parseCsv(text);
    expect(rows).toEqual([["Hello", "instagram", ""]]);
  });

  it("handles a trailing field without a comma", () => {
    const text = "caption,platforms\nHello,instagram";
    const { rows } = parseCsv(text);
    expect(rows).toEqual([["Hello", "instagram"]]);
  });
});

describe("bulk-schedule/csv.ts - normalizePlatforms", () => {
  it("returns canonical ids for known aliases", () => {
    expect(normalizePlatforms("twitter").sort()).toEqual(["twitter"]);
    expect(normalizePlatforms("x").sort()).toEqual(["twitter"]);
    expect(normalizePlatforms("ig").sort()).toEqual(["instagram"]);
    expect(normalizePlatforms("facebook").sort()).toEqual(["facebook"]);
    expect(normalizePlatforms("fb").sort()).toEqual(["facebook"]);
    expect(normalizePlatforms("yt").sort()).toEqual(["youtube"]);
    expect(normalizePlatforms("bsky").sort()).toEqual(["bluesky"]);
  });

  it("splits on common separators", () => {
    expect(normalizePlatforms("twitter,instagram").sort()).toEqual(["instagram", "twitter"]);
    expect(normalizePlatforms("twitter|instagram").sort()).toEqual(["instagram", "twitter"]);
    expect(normalizePlatforms("twitter/instagram").sort()).toEqual(["instagram", "twitter"]);
    expect(normalizePlatforms("twitter;instagram").sort()).toEqual(["instagram", "twitter"]);
  });

  it("deduplicates aliases of the same platform", () => {
    expect(normalizePlatforms("twitter,x").sort()).toEqual(["twitter"]);
    expect(normalizePlatforms("instagram,ig,insta").sort()).toEqual(["instagram"]);
  });

  it("ignores unknown tokens", () => {
    expect(normalizePlatforms("myspace,twitter").sort()).toEqual(["twitter"]);
    expect(normalizePlatforms("").sort()).toEqual([]);
  });

  it("lowercases and trims input", () => {
    expect(normalizePlatforms("  Twitter , X ").sort()).toEqual(["twitter"]);
  });
});

describe("bulk-schedule/csv.ts - normalizeHashtags", () => {
  it("prepends # to bare words", () => {
    expect(normalizeHashtags("hello")).toEqual(["#hello"]);
  });

  it("preserves existing # prefix", () => {
    expect(normalizeHashtags("#hello")).toEqual(["#hello"]);
  });

  it("splits on whitespace, comma, semicolon, pipe", () => {
    expect(normalizeHashtags("hello world,foo;bar|baz").sort()).toEqual([
      "#bar",
      "#baz",
      "#foo",
      "#hello",
      "#world",
    ]);
  });

  it("drops empty tokens", () => {
    expect(normalizeHashtags("hello,,world")).toEqual(["#hello", "#world"]);
  });

  it("handles mixed input", () => {
    expect(normalizeHashtags("#hello, world")).toEqual(["#hello", "#world"]);
  });
});
