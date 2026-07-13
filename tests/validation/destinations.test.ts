import { describe, it, expect } from "vitest";
import {
  destinationSchema,
  webhookSchema,
  webhookEventSchema,
} from "@/lib/validation/destinations";
import { parseValue } from "@/lib/validation/helpers";

describe("validation/destinations - destinationSchema", () => {
  it("accepts a webhook destination", () => {
    const r = parseValue(
      { platform: "twitter", type: "webhook", url: "https://x.example.com/h" },
      destinationSchema
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.active).toBe(true);
  });

  it("rejects non-http url", () => {
    const r = parseValue(
      { platform: "custom", type: "webhook", url: "ftp://x" },
      destinationSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects unknown platform", () => {
    const r = parseValue(
      { platform: "mastodon", type: "webhook", url: "https://x.com" },
      destinationSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/destinations - webhookSchema", () => {
  it("accepts a webhook with events", () => {
    const r = parseValue(
      {
        url: "https://x.example.com/wh",
        events: ["post.published", "inbox.comment"],
        secret: "abcdefghij",
      },
      webhookSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects empty events", () => {
    const r = parseValue(
      {
        url: "https://x.com/wh",
        events: [],
        secret: "abcdefghij",
      },
      webhookSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects short secret", () => {
    const r = parseValue(
      {
        url: "https://x.com/wh",
        events: ["post.published"],
        secret: "abc",
      },
      webhookSchema
    );
    expect(r.ok).toBe(false);
  });

  it("accepts all valid events", () => {
    ["post.published", "post.failed", "post.scheduled", "inbox.comment", "inbox.message"].forEach((e) => {
      expect(webhookEventSchema.safeParse(e).success).toBe(true);
    });
  });
});
