import { describe, expect, it } from "vitest";
import { fitCaptionForPlatform } from "@/lib/ai/caption-fit";

describe("fitCaptionForPlatform", () => {
  it("keeps captions unchanged when they fit", () => {
    expect(fitCaptionForPlatform("A short caption.", "twitter")).toBe("A short caption.");
    expect(fitCaptionForPlatform("A short caption.", "threads")).toBe("A short caption.");
    expect(fitCaptionForPlatform("A short caption.", "pinterest")).toBe("A short caption.");
    expect(fitCaptionForPlatform("A short caption.", "bluesky")).toBe("A short caption.");
  });

  it("removes trailing hashtags before trimming body text", () => {
    const result = fitCaptionForPlatform(
      `${"A cozy morning with a curious kitten by the window. ".repeat(11)} #cats #cozy #morning`,
      "threads",
    );
    expect(result.length).toBeLessThanOrEqual(500);
    expect(result).not.toMatch(/#cats|#cozy|#morning/);
  });

  it("fits X within its 280-character budget", () => {
    const result = fitCaptionForPlatform("A thoughtful sentence about a peaceful morning. ".repeat(12), "twitter");
    expect(result.length).toBeLessThanOrEqual(280);
    expect(result).toMatch(/[.!?…]$/);
  });

  it("fits Pinterest and Bluesky within their platform budgets", () => {
    const caption = "A peaceful moment with a curious kitten by the window. ".repeat(14);
    expect(fitCaptionForPlatform(caption, "pinterest").length).toBeLessThanOrEqual(500);
    expect(fitCaptionForPlatform(caption, "bluesky").length).toBeLessThanOrEqual(300);
  });
});
