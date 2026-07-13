import { describe, it, expect } from "vitest";
import { createLabelSchema, updateLabelSchema, labelColorSchema } from "@/lib/validation/labels";
import { createHashtagSetSchema, updateHashtagSetSchema, trendingHashtagFilterSchema } from "@/lib/validation/hashtags";
import {
  createReportSchema,
  reportScheduleSchema,
  reportTemplateSchema,
  updateReportScheduleSchema,
} from "@/lib/validation/reports";
import { parseValue, parseSearchParams } from "@/lib/validation/helpers";

describe("validation/labels - labelColorSchema", () => {
  it("accepts 3-digit hex", () => {
    expect(labelColorSchema.safeParse("#abc").success).toBe(true);
  });
  it("accepts 6-digit hex", () => {
    expect(labelColorSchema.safeParse("#abcdef").success).toBe(true);
  });
  it("rejects rgb", () => {
    expect(labelColorSchema.safeParse("rgb(0,0,0)").success).toBe(false);
  });
});

describe("validation/labels - createLabelSchema", () => {
  it("accepts name only and applies default color", () => {
    const r = parseValue({ name: "VIP" }, createLabelSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.color).toBe("#6366f1");
  });

  it("rejects empty name", () => {
    const r = parseValue({ name: "" }, createLabelSchema);
    expect(r.ok).toBe(false);
  });
});

describe("validation/labels - updateLabelSchema", () => {
  it("accepts partial updates", () => {
    const r = parseValue({ color: "#ff0000" }, updateLabelSchema);
    expect(r.ok).toBe(true);
  });
});

describe("validation/hashtags - createHashtagSetSchema", () => {
  it("accepts valid set", () => {
    const r = parseValue(
      { name: "Marketing", hashtags: ["#social", "#media"], platform: "twitter" },
      createHashtagSetSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects empty hashtags", () => {
    const r = parseValue(
      { name: "Empty", hashtags: [] },
      createHashtagSetSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects too many hashtags", () => {
    const r = parseValue(
      { name: "Big", hashtags: Array.from({ length: 101 }, (_, i) => `#t${i}`) },
      createHashtagSetSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/hashtags - trendingHashtagFilterSchema", () => {
  it("applies default pageSize", () => {
    const r = parseSearchParams(new URLSearchParams(""), trendingHashtagFilterSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pageSize).toBe(20);
  });

  it("coerces pageSize from string", () => {
    const r = parseSearchParams(new URLSearchParams("pageSize=5"), trendingHashtagFilterSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pageSize).toBe(5);
  });
});

describe("validation/reports - reportTemplateSchema", () => {
  it("accepts valid templates", () => {
    ["performance", "engagement", "audience", "competitor", "custom"].forEach((t) => {
      expect(reportTemplateSchema.safeParse(t).success).toBe(true);
    });
  });

  it("rejects unknown", () => {
    expect(reportTemplateSchema.safeParse("bogus").success).toBe(false);
  });
});

describe("validation/reports - createReportSchema", () => {
  it("accepts a valid report", () => {
    const r = parseValue(
      {
        name: "Q1 Performance",
        template: "performance",
        dateRange: { from: "2026-01-01", to: "2026-03-31" },
        format: "csv",
      },
      createReportSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects from > to", () => {
    const r = parseValue(
      {
        name: "Bad range",
        template: "performance",
        dateRange: { from: "2026-03-01", to: "2026-01-01" },
      },
      createReportSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/reports - reportScheduleSchema", () => {
  it("accepts a valid schedule", () => {
    const r = parseValue(
      {
        name: "Weekly digest",
        cron: "0 9 * * 1",
        recipients: ["me@example.com"],
      },
      reportScheduleSchema
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.paused).toBe(false);
  });

  it("rejects empty recipients", () => {
    const r = parseValue(
      { name: "X", cron: "0 9 * * 1", recipients: [] },
      reportScheduleSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/reports - updateReportScheduleSchema", () => {
  it("accepts partial updates", () => {
    const r = parseValue({ paused: true }, updateReportScheduleSchema);
    expect(r.ok).toBe(true);
  });
});
