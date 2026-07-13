import { describe, it, expect } from "vitest";
import {
  createPostSchema,
  updatePostSchema,
  bulkScheduleSchema,
  postFiltersSchema,
  postStatusSchema,
  platformIdSchema,
} from "@/lib/validation/posts";
import { parseValue, parseSearchParams } from "@/lib/validation/helpers";

describe("validation/posts - platformIdSchema", () => {
  it("accepts all 9 platforms", () => {
    ["bluesky", "instagram", "tiktok", "youtube", "pinterest", "twitter", "linkedin", "threads", "facebook"].forEach((p) => {
      expect(platformIdSchema.safeParse(p).success).toBe(true);
    });
  });

  it("rejects unknown platform", () => {
    expect(platformIdSchema.safeParse("mastodon").success).toBe(false);
  });
});

describe("validation/posts - postStatusSchema", () => {
  it("accepts all 7 statuses", () => {
    ["draft", "queued", "scheduled", "publishing", "published", "failed", "archived"].forEach((s) => {
      expect(postStatusSchema.safeParse(s).success).toBe(true);
    });
  });

  it("rejects unknown status", () => {
    expect(postStatusSchema.safeParse("drafty").success).toBe(false);
  });
});

describe("validation/posts - createPostSchema", () => {
  it("accepts a minimal valid post", () => {
    const result = parseValue(
      {
        caption: "hello world",
        platforms: ["twitter", "facebook"],
      },
      createPostSchema
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.caption).toBe("hello world");
      expect(result.data.platforms).toEqual(["twitter", "facebook"]);
      expect(result.data.status).toBe("draft");
      expect(result.data.mediaUrls).toEqual([]);
    }
  });

  it("rejects empty caption", () => {
    const result = parseValue({ caption: "", platforms: ["twitter"] }, createPostSchema);
    expect(result.ok).toBe(false);
  });

  it("rejects when no platforms provided", () => {
    const result = parseValue({ caption: "hi", platforms: [] }, createPostSchema);
    expect(result.ok).toBe(false);
  });

  it("rejects when caption exceeds 22000 chars", () => {
    const result = parseValue(
      { caption: "x".repeat(22001), platforms: ["twitter"] },
      createPostSchema
    );
    expect(result.ok).toBe(false);
  });

  it("rejects when scheduledAt is in the past", () => {
    const result = parseValue(
      {
        caption: "future",
        platforms: ["twitter"],
        status: "scheduled",
        scheduledAt: new Date(Date.now() - 86400000).toISOString(),
      },
      createPostSchema
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a future scheduledAt", () => {
    const result = parseValue(
      {
        caption: "future",
        platforms: ["twitter"],
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
      createPostSchema
    );
    expect(result.ok).toBe(true);
  });

  it("accepts scheduledAt within 1 minute grace window", () => {
    const result = parseValue(
      {
        caption: "soon",
        platforms: ["twitter"],
        status: "scheduled",
        scheduledAt: new Date(Date.now() - 30000).toISOString(),
      },
      createPostSchema
    );
    expect(result.ok).toBe(true);
  });
});

describe("validation/posts - updatePostSchema", () => {
  it("accepts partial updates", () => {
    const result = parseValue({ caption: "new caption" }, updatePostSchema);
    expect(result.ok).toBe(true);
  });

  it("accepts empty object (no-op update)", () => {
    const result = parseValue({}, updatePostSchema);
    expect(result.ok).toBe(true);
  });
});

describe("validation/posts - bulkScheduleSchema", () => {
  it("rejects empty items array", () => {
    const result = parseValue({ items: [] }, bulkScheduleSchema);
    expect(result.ok).toBe(false);
  });

  it("accepts up to 100 items", () => {
    const items = Array.from({ length: 50 }, () => ({
      caption: "bulk",
      platforms: ["twitter"],
    }));
    const result = parseValue({ items }, bulkScheduleSchema);
    expect(result.ok).toBe(true);
  });

  it("rejects more than 100 items", () => {
    const items = Array.from({ length: 101 }, () => ({
      caption: "bulk",
      platforms: ["twitter"],
    }));
    const result = parseValue({ items }, bulkScheduleSchema);
    expect(result.ok).toBe(false);
  });

  it("rejects when any item fails validation", () => {
    const result = parseValue(
      {
        items: [
          { caption: "ok", platforms: ["twitter"] },
          { caption: "", platforms: ["twitter"] },
        ],
      },
      bulkScheduleSchema
    );
    expect(result.ok).toBe(false);
  });
});

describe("validation/posts - postFiltersSchema", () => {
  it("applies defaults", () => {
    const result = parseSearchParams(new URLSearchParams(""), postFiltersSchema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.pageSize).toBe(25);
  });

  it("coerces pageSize from string", () => {
    const result = parseSearchParams(new URLSearchParams("pageSize=50"), postFiltersSchema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.pageSize).toBe(50);
  });

  it("rejects pageSize > 100", () => {
    const result = parseSearchParams(new URLSearchParams("pageSize=500"), postFiltersSchema);
    expect(result.ok).toBe(false);
  });
});