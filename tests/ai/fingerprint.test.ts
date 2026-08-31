import { describe, it, expect } from "vitest";
import {
  calculateContentHash,
  calculateGenerationConfigHash,
  calculateCaptionFingerprint,
} from "@/lib/ai/fingerprint";

describe("lib/ai/fingerprint", () => {
  it("generates deterministic hash for identical content", () => {
    const input1 = {
      mediaUrls: ["https://cdn.example.com/b.jpg", "https://cdn.example.com/a.jpg"],
      imageUrl: "https://cdn.example.com/a.jpg",
      videoTitle: "Product Launch Video",
    };
    const input2 = {
      mediaUrls: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
      imageUrl: "https://cdn.example.com/a.jpg",
      videoTitle: "product launch video",
    };

    expect(calculateContentHash(input1)).toBe(calculateContentHash(input2));
  });

  it("generates different hashes when content differs", () => {
    const hashA = calculateContentHash({ videoTitle: "Video A" });
    const hashB = calculateContentHash({ videoTitle: "Video B" });
    expect(hashA).not.toBe(hashB);
  });

  it("generates deterministic hash for generation config", () => {
    const config1 = {
      tone: "Friendly",
      includeHashtags: true,
      useEmojis: true,
      platforms: [{ id: "twitter" }, { id: "instagram" }],
    };
    const config2 = {
      tone: "friendly",
      includeHashtags: true,
      useEmojis: true,
      platforms: [{ id: "instagram" }, { id: "twitter" }],
    };

    expect(calculateGenerationConfigHash(config1)).toBe(calculateGenerationConfigHash(config2));
  });

  it("generates different hashes when generation config differs", () => {
    const configA = calculateGenerationConfigHash({ tone: "professional" });
    const configB = calculateGenerationConfigHash({ tone: "casual" });
    expect(configA).not.toBe(configB);
  });

  it("computes full fingerprint deterministically", () => {
    const fp1 = calculateCaptionFingerprint({
      inputSnapshot: {
        tone: "humorous",
        imageUrl: "https://example.com/pic.png",
        videoTitle: "Funny Clip",
      },
    });

    const fp2 = calculateCaptionFingerprint({
      inputSnapshot: {
        tone: "humorous",
        imageUrl: "https://example.com/pic.png",
        videoTitle: "funny clip",
      },
    });

    expect(fp1.fingerprint).toBe(fp2.fingerprint);
    expect(fp1.contentHash).toBe(fp2.contentHash);
    expect(fp1.generationConfigHash).toBe(fp2.generationConfigHash);
  });
});
