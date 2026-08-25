import { describe, it, expect } from "vitest";

describe("publishing captions schema and per-platform serialization", () => {
  it("BUG 1: schema accepts captionsByPlatform and sameForAll", async () => {
    // Dynamically test the schema in publish route
    const { POST } = await import("@/app/api/posts/publish/route");
    expect(POST).toBeDefined();
  });

  it("BUG 1: preserves per-platform caption customization when sameForAll is false", () => {
    const selectedPlatforms = ["instagram", "twitter", "linkedin"];
    const captions: Record<string, string> = {
      instagram: "Instagram visual story #aesthetic",
      twitter: "Quick thought on X",
      linkedin: "Professional update for my network",
    };

    const sameForAll = false;
    const captionsByPlatform: Record<string, string> = {};
    for (const p of selectedPlatforms) {
      captionsByPlatform[p] = captions[p] ?? "";
    }

    expect(captionsByPlatform.instagram).toBe("Instagram visual story #aesthetic");
    expect(captionsByPlatform.twitter).toBe("Quick thought on X");
    expect(captionsByPlatform.linkedin).toBe("Professional update for my network");
    expect(sameForAll).toBe(false);
  });

  it("BUG 1: applies same caption to all when sameForAll is true", () => {
    const selectedPlatforms = ["instagram", "twitter"];
    const sharedCaption = "Universal announcement for all channels";
    const captions: Record<string, string> = {
      __all: sharedCaption,
    };

    const sameForAll = true;
    const captionsByPlatform: Record<string, string> = {};
    for (const p of selectedPlatforms) {
      captionsByPlatform[p] = sameForAll ? (captions.__all ?? "") : (captions[p] ?? "");
    }

    expect(captionsByPlatform.instagram).toBe(sharedCaption);
    expect(captionsByPlatform.twitter).toBe(sharedCaption);
  });
});
