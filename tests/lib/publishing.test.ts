import { describe, it, expect } from "vitest";
import {
  CAPABILITY_MATRIX,
  getCapability,
  supportsMediaKind,
} from "@/lib/publishing/capability-matrix";
import {
  FIELD_SPECS,
  getFieldSpecs,
  getDefaultOptions,
  getFieldSpec,
  getVisibleSpecs,
} from "@/lib/publishing/advanced-options";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";

describe("lib/publishing/capability-matrix", () => {
  it("covers every platform in PLATFORMS", () => {
    for (const p of PLATFORMS) {
      expect(CAPABILITY_MATRIX[p.id]).toBeDefined();
    }
  });

  it("every platform reports at least one supported media kind", () => {
    for (const p of PLATFORMS) {
      const cap = CAPABILITY_MATRIX[p.id];
      expect(cap.supportsText || cap.supportsImage || cap.supportsVideo).toBe(true);
    }
  });

  it("bluesky does not support video", () => {
    expect(supportsMediaKind("bluesky", "video")).toBe(false);
    expect(supportsMediaKind("bluesky", "image")).toBe(true);
  });

  it("youtube supports only video", () => {
    expect(supportsMediaKind("youtube", "video")).toBe(true);
    expect(supportsMediaKind("youtube", "image")).toBe(false);
    expect(supportsMediaKind("youtube", "text")).toBe(false);
  });

  it("getCapability returns the same object as direct indexing", () => {
    for (const p of PLATFORMS) {
      expect(getCapability(p.id)).toBe(CAPABILITY_MATRIX[p.id]);
    }
  });

  it("hard caps are positive numbers within sane bounds", () => {
    for (const p of PLATFORMS) {
      const cap = CAPABILITY_MATRIX[p.id];
      expect(cap.hardCapPer24h).toBeGreaterThan(0);
      expect(cap.hardCapPer24h).toBeLessThanOrEqual(150);
    }
  });

  it("every media requirement has positive byte limits and valid mime prefixes", () => {
    for (const p of PLATFORMS) {
      const cap = CAPABILITY_MATRIX[p.id];
      for (const kind of ["image", "video"] as const) {
        const req = cap.media[kind];
        if (!req) continue;
        expect(req.maxBytes).toBeGreaterThan(0);
        for (const f of req.formats) {
          expect(f).toMatch(/^(image|video)\//);
        }
      }
    }
  });
});

describe("lib/publishing/advanced-options", () => {
  it("every platform has at least one field spec", () => {
    for (const p of PLATFORMS) {
      expect((FIELD_SPECS[p.id] ?? []).length).toBeGreaterThan(0);
    }
  });

  it("field spec keys are unique within each platform", () => {
    for (const p of PLATFORMS) {
      const keys = (FIELD_SPECS[p.id] ?? []).map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("segmented/select specs include at least one option", () => {
    for (const p of PLATFORMS) {
      for (const spec of FIELD_SPECS[p.id] ?? []) {
        if (spec.kind === "segmented" || spec.kind === "select") {
          expect((spec.options ?? []).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("getDefaultOptions seeds defaults for every spec that declares one", () => {
    for (const p of PLATFORMS) {
      const defaults = getDefaultOptions(p.id);
      for (const spec of FIELD_SPECS[p.id] ?? []) {
        if (spec.default !== undefined) {
          expect(defaults[spec.key]).toEqual(spec.default);
        }
      }
    }
  });

  it("getFieldSpec returns the matching spec by key", () => {
    const ig = getFieldSpec("instagram", "instagram_media_type");
    expect(ig?.kind).toBe("segmented");
    expect(getFieldSpec("instagram", "does_not_exist")).toBeUndefined();
  });

  it("getVisibleSpecs hides fields with a non-matching showWhen mediaKind", () => {
    const specs = getVisibleSpecs("instagram", "image", {}, true);
    // REELS-only fields should be hidden under image
    const reelsOnly = specs.filter((s) => s.showWhen?.fieldEquals?.key === "instagram_media_type");
    expect(reelsOnly.length).toBe(0);
  });

  it("getVisibleSpecs shows REELS fields once media_type is REELS", () => {
    const value = { instagram_media_type: "REELS" };
    const specs = getVisibleSpecs("instagram", "video", value, true);
    const coverUrl = specs.find((s) => s.key === "instagram_cover_url");
    expect(coverUrl).toBeDefined();
  });

  it("getVisibleSpecs respects the includeAdvanced flag", () => {
    const all = getVisibleSpecs("tiktok", "video", {}, true);
    const core = getVisibleSpecs("tiktok", "video", {}, false);
    expect(all.length).toBeGreaterThan(core.length);
  });

  it("youtube privacy defaults to unlisted", () => {
    expect(getDefaultOptions("youtube").youtube_privacy).toBe("unlisted");
  });

  it("twitter long_text_as_post defaults to true", () => {
    expect(getDefaultOptions("twitter").twitter_long_text_as_post).toBe(true);
  });

  it("instagram media_type defaults to FEED", () => {
    expect(getDefaultOptions("instagram").instagram_media_type).toBe("FEED");
  });

  it("tiktok privacy defaults to PUBLIC_TO_EVERYONE", () => {
    expect(getDefaultOptions("tiktok").tiktok_privacy_level).toBe("PUBLIC_TO_EVERYONE");
  });

  it("number fields declare min when relevant", () => {
    const offsetSpec = getFieldSpec("instagram", "instagram_thumbnail_offset_ms");
    expect(offsetSpec?.min).toBe(0);
  });
});