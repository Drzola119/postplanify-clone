import { describe, it, expect } from "vitest";
import { createAutoDmSchema, updateAutoDmSchema } from "@/lib/validation/automations";

describe("lib/validation/automations", () => {
  it("rejects a campaign with no trigger", () => {
    const r = createAutoDmSchema.safeParse({
      name: "Hi",
      platforms: ["instagram"],
      template: "Hi!",
    });
    expect(r.success).toBe(false);
  });

  it("accepts comment-keyword trigger", () => {
    const r = createAutoDmSchema.safeParse({
      name: "PRICE reply",
      status: "active",
      trigger: { kind: "comment-keyword", keyword: "PRICE", match: "contains" },
      platforms: ["instagram", "twitter"],
      template: "Here's the link",
    });
    expect(r.success).toBe(true);
  });

  it("accepts first-comment trigger without postId", () => {
    const r = createAutoDmSchema.safeParse({
      name: "Welcome",
      trigger: { kind: "first-comment" },
      platforms: ["instagram"],
      template: "Thanks!",
    });
    expect(r.success).toBe(true);
  });

  it("rejects more than 9 platforms", () => {
    const r = createAutoDmSchema.safeParse({
      name: "All",
      trigger: { kind: "follow" },
      platforms: ["instagram", "twitter", "linkedin", "facebook", "tiktok", "youtube", "threads", "pinterest", "bluesky", "instagram"],
      template: "Hi",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty platforms", () => {
    const r = createAutoDmSchema.safeParse({
      name: "Nope",
      trigger: { kind: "follow" },
      platforms: [],
      template: "Hi",
    });
    expect(r.success).toBe(false);
  });

  it("cap must be 1-10", () => {
    const ok = createAutoDmSchema.safeParse({
      name: "X",
      trigger: { kind: "follow" },
      platforms: ["instagram"],
      template: "Hi",
      perAuthorPerDayCap: 5,
    });
    expect(ok.success).toBe(true);
    const bad = createAutoDmSchema.safeParse({
      name: "X",
      trigger: { kind: "follow" },
      platforms: ["instagram"],
      template: "Hi",
      perAuthorPerDayCap: 50,
    });
    expect(bad.success).toBe(false);
  });

  it("patch allows partial fields", () => {
    expect(updateAutoDmSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(updateAutoDmSchema.safeParse({ template: "x" }).success).toBe(true);
    expect(updateAutoDmSchema.safeParse({}).success).toBe(true);
  });
});
