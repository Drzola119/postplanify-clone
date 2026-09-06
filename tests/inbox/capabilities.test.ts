import { describe, it, expect } from "vitest";
import {
  effectiveSupport,
  supportMatrix,
  privateReplyEligibility,
  dmWindowEligibility,
  allPlatformIds,
} from "@/lib/inbox/capabilities";

describe("inbox capabilities", () => {
  it("uses the canonical 13-platform registry (no hard-coded subset)", () => {
    expect(allPlatformIds()).toHaveLength(13);
    expect(allPlatformIds()).toContain("instagram");
    expect(allPlatformIds()).toContain("reddit");
  });

  it("supports Instagram read/reply/dm operations when connected", () => {
    const ops = supportMatrix("instagram", { platform: "instagram" });
    expect(ops).toHaveLength(9);
    for (const op of ["read-comments", "reply-public", "reply-private", "read-conversations", "send-dm"] as const) {
      expect(ops.find((o) => o.operation === op)?.status).toBe("supported");
    }
  });

  it("keeps disconnected / permission-required / unsupported distinct", () => {
    expect(effectiveSupport("instagram", null, "reply-public").status).toBe("disconnected");
    expect(
      effectiveSupport("instagram", { platform: "instagram", reauthRequired: true }, "send-dm").status
    ).toBe("permission-required");
    expect(
      effectiveSupport("instagram", { platform: "instagram", hasFacebookPage: false }, "send-dm").status
    ).toBe("permission-required");
    // Unknown FB linkage must not block (permissive on unknown, strict on known-ineligible).
    expect(
      effectiveSupport("instagram", { platform: "instagram" }, "send-dm").status
    ).toBe("supported");
    expect(effectiveSupport("instagram", { platform: "instagram" }, "moderate-comment").status).toBe(
      "unsupported"
    );
  });

  it("marks out-of-scope platforms honestly (no fabricated conversations)", () => {
    // Documented upstream but outside V1 scope → not-yet-verified, never usable send buttons.
    expect(effectiveSupport("facebook", { platform: "facebook" }, "read-comments").status).toBe(
      "not-yet-verified"
    );
    // Undocumented upstream → unsupported.
    expect(effectiveSupport("facebook", { platform: "facebook" }, "send-dm").status).toBe("unsupported");
  });

  it("enforces the 7-day private-reply window", () => {
    expect(privateReplyEligibility(new Date(Date.now() - 24 * 3600 * 1000))).toBe("supported");
    expect(privateReplyEligibility(new Date(Date.now() - 8 * 24 * 3600 * 1000))).toBe("unsupported");
  });

  it("computes the DM window from inbound timestamps only", () => {
    expect(dmWindowEligibility(null)).toBe("not-yet-verified");
    expect(dmWindowEligibility(new Date(Date.now() - 3600 * 1000))).toBe("supported");
    expect(dmWindowEligibility(new Date(Date.now() - 25 * 3600 * 1000))).toBe("unsupported");
  });
});
