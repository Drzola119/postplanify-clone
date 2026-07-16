import { describe, it, expect } from "vitest";
import {
  PLATFORM_SPECS,
  RATIO_GROUPS,
  getRatioGroup,
  getPlatformSpec,
  getRatioKeyForPlatform,
  getSupportedPlatforms,
  isSupportedPlatform,
  filterValidPlatforms,
  getRatioGroupsForPlatforms,
  needsOutpainting,
  getDeliveryDimensions,
  toEnginePlatform,
  toEnginePlatforms,
  fromEnginePlatform,
} from "@/lib/images/platform-ratios";

describe("PLATFORM_SPECS — 2026-07-15 spec", () => {
  it("matches LinkedIn to 1:1 (1080×1080)", () => {
    expect(PLATFORM_SPECS.linkedin).toEqual({
      width: 1080,
      height: 1080,
      ratio: "1:1",
      ratioKey: "1x1",
    });
  });

  it("matches TikTok to 4:5 (1080×1350)", () => {
    expect(PLATFORM_SPECS.tiktok).toEqual({
      width: 1080,
      height: 1350,
      ratio: "4:5",
      ratioKey: "4x5",
    });
  });

  it("matches Twitter/X to 16:9 (1600×900)", () => {
    expect(PLATFORM_SPECS.twitter).toEqual({
      width: 1600,
      height: 900,
      ratio: "16:9",
      ratioKey: "16x9",
    });
  });

  it("matches Pinterest to 2:3 (1000×1500)", () => {
    expect(PLATFORM_SPECS.pinterest).toEqual({
      width: 1000,
      height: 1500,
      ratio: "2:3",
      ratioKey: "2x3",
    });
  });

  it("covers Instagram, Facebook, Threads at 4:5", () => {
    expect(PLATFORM_SPECS.instagram.ratioKey).toBe("4x5");
    expect(PLATFORM_SPECS.facebook.ratioKey).toBe("4x5");
    expect(PLATFORM_SPECS.threads.ratioKey).toBe("4x5");
  });

  it("covers Reddit, Bluesky, YouTube at 1:1", () => {
    expect(PLATFORM_SPECS.reddit.ratioKey).toBe("1x1");
    expect(PLATFORM_SPECS.bluesky.ratioKey).toBe("1x1");
    expect(PLATFORM_SPECS.youtube.ratioKey).toBe("1x1");
  });

  it("does NOT define the legacy 9:16 ratio group (TikTok is 4:5)", () => {
    const nineBySixteen = RATIO_GROUPS.find((g) => g.ratio === "9:16");
    expect(nineBySixteen).toBeUndefined();
  });

  it("includes the 3 trustiify extras (discord, telegram, google_business) at 1:1", () => {
    expect(PLATFORM_SPECS.discord.ratioKey).toBe("1x1");
    expect(PLATFORM_SPECS.telegram.ratioKey).toBe("1x1");
    expect(PLATFORM_SPECS.google_business.ratioKey).toBe("1x1");
  });
});

describe("getRatioGroup", () => {
  it("returns the group for a known ratio key", () => {
    const g = getRatioGroup("4x5");
    expect(g?.width).toBe(1080);
    expect(g?.height).toBe(1350);
  });

  it("returns undefined for an unknown key", () => {
    expect(getRatioGroup("nope")).toBeUndefined();
  });
});

describe("getPlatformSpec", () => {
  it("looks up by lowercase trustiify id", () => {
    expect(getPlatformSpec("INSTAGRAM")?.ratioKey).toBe("4x5");
    expect(getPlatformSpec("instagram")?.ratioKey).toBe("4x5");
  });

  it("trims whitespace", () => {
    expect(getPlatformSpec("  twitter  ")?.ratioKey).toBe("16x9");
  });

  it("returns undefined for unknown platforms", () => {
    expect(getPlatformSpec("myspace")).toBeUndefined();
  });
});

describe("getRatioKeyForPlatform", () => {
  it("returns null for unknown platforms", () => {
    expect(getRatioKeyForPlatform("unknown")).toBeNull();
  });

  it("returns the correct key for known platforms", () => {
    expect(getRatioKeyForPlatform("instagram")).toBe("4x5");
    expect(getRatioKeyForPlatform("linkedin")).toBe("1x1");
    expect(getRatioKeyForPlatform("twitter")).toBe("16x9");
    expect(getRatioKeyForPlatform("pinterest")).toBe("2x3");
  });
});

describe("isSupportedPlatform / getSupportedPlatforms / filterValidPlatforms", () => {
  it("recognises every defined platform id (case-insensitive)", () => {
    for (const id of Object.keys(PLATFORM_SPECS)) {
      expect(isSupportedPlatform(id)).toBe(true);
      expect(isSupportedPlatform(id.toUpperCase())).toBe(true);
    }
  });

  it("rejects unknown platforms", () => {
    expect(isSupportedPlatform("nope")).toBe(false);
  });

  it("getSupportedPlatforms returns the full key list", () => {
    const ids = getSupportedPlatforms();
    expect(ids.length).toBeGreaterThanOrEqual(12);
    expect(ids).toContain("twitter");
    expect(ids).toContain("discord");
    expect(ids).toContain("google_business");
  });

  it("filterValidPlatforms splits supported and unsupported", () => {
    const { valid, unsupported } = filterValidPlatforms([
      "instagram",
      "Twitter",
      "nope",
      "TIKTOK",
      "fakeplatform",
    ]);
    expect(valid).toEqual(["instagram", "twitter", "tiktok"]);
    expect(unsupported).toEqual(["nope", "fakeplatform"]);
  });

  it("filterValidPlatforms deduplicates", () => {
    const { valid } = filterValidPlatforms(["instagram", "INSTAGRAM", "instagram"]);
    expect(valid).toEqual(["instagram"]);
  });
});

describe("getRatioGroupsForPlatforms", () => {
  it("returns empty array when no platforms are supported", () => {
    expect(getRatioGroupsForPlatforms(["nope"])).toEqual([]);
  });

  it("returns unique ratio groups for the selected platforms", () => {
    const groups = getRatioGroupsForPlatforms(["instagram", "tiktok", "linkedin", "twitter"]);
    const keys = groups.map((g) => g.ratioKey).sort();
    expect(keys).toEqual(["16x9", "1x1", "4x5"]);
  });

  it("deduplicates when many platforms share one group", () => {
    const groups = getRatioGroupsForPlatforms(["instagram", "tiktok", "facebook", "threads"]);
    expect(groups.length).toBe(1);
    expect(groups[0]?.ratioKey).toBe("4x5");
  });
});

describe("needsOutpainting", () => {
  it("returns false when all platforms share one ratio group", () => {
    expect(needsOutpainting(["instagram", "tiktok", "facebook", "threads"])).toBe(false);
    expect(needsOutpainting(["linkedin", "reddit"])).toBe(false);
    expect(needsOutpainting(["pinterest"])).toBe(false);
    expect(needsOutpainting(["twitter"])).toBe(false);
  });

  it("returns true when ≥2 distinct ratio groups are required", () => {
    expect(needsOutpainting(["instagram", "linkedin"])).toBe(true);   // 4:5 + 1:1
    expect(needsOutpainting(["instagram", "twitter"])).toBe(true);   // 4:5 + 16:9
    expect(needsOutpainting(["instagram", "pinterest"])).toBe(true); // 4:5 + 2:3
    expect(needsOutpainting(["instagram", "linkedin", "twitter", "pinterest"])).toBe(true);
  });

  it("ignores unknown platforms when deciding", () => {
    // Only `linkedin` is valid; rest are ignored → 1 group → no outpainting.
    expect(needsOutpainting(["linkedin", "myspace"])).toBe(false);
  });
});

describe("getDeliveryDimensions", () => {
  it("returns platform-specific dims for known platforms", () => {
    expect(getDeliveryDimensions("pinterest")).toEqual({ width: 1000, height: 1500 });
    expect(getDeliveryDimensions("twitter")).toEqual({ width: 1600, height: 900 });
  });

  it("falls back to 1080×1080 for unknown platforms", () => {
    expect(getDeliveryDimensions("nope")).toEqual({ width: 1080, height: 1080 });
  });
});

describe("toEnginePlatform / toEnginePlatforms / fromEnginePlatform", () => {
  it("translates trustiify `twitter` → engine `x`", () => {
    expect(toEnginePlatform("twitter")).toBe("x");
  });

  it("lowercases + trims input", () => {
    expect(toEnginePlatform("  TWITTER  ")).toBe("x");
  });

  it("is identity for all other trustiify platforms", () => {
    expect(toEnginePlatform("instagram")).toBe("instagram");
    expect(toEnginePlatform("linkedin")).toBe("linkedin");
    expect(toEnginePlatform("pinterest")).toBe("pinterest");
  });

  it("toEnginePlatforms translates a list", () => {
    expect(toEnginePlatforms(["twitter", "instagram", "TIKTOK"])).toEqual([
      "x",
      "instagram",
      "tiktok",
    ]);
  });

  it("fromEnginePlatform translates engine `x` → trustiify `twitter`", () => {
    expect(fromEnginePlatform("x")).toBe("twitter");
    expect(fromEnginePlatform("X")).toBe("twitter");
  });

  it("fromEnginePlatform is identity for everything else", () => {
    expect(fromEnginePlatform("instagram")).toBe("instagram");
    expect(fromEnginePlatform("linkedin")).toBe("linkedin");
  });

  it("toEnginePlatform and fromEnginePlatform round-trip cleanly", () => {
    for (const id of ["twitter", "instagram", "linkedin", "pinterest"]) {
      expect(fromEnginePlatform(toEnginePlatform(id))).toBe(id);
    }
  });
});