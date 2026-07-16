import { describe, it, expect } from "vitest";
import { inboxEventSchema } from "@/lib/validation/inbox-events";

const valid = {
  workspaceId: "ws1",
  platform: "instagram",
  type: "comment",
  externalId: "ig-1",
  authorHandle: "alice",
  body: "love this!",
  sentAt: "2026-07-16T08:00:00.000Z",
};

describe("validation/inbox-events", () => {
  it("accepts a minimal valid comment event", () => {
    const r = inboxEventSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.direction).toBe("in");
    }
  });

  it("accepts all 12 platforms", () => {
    for (const p of [
      "bluesky", "instagram", "tiktok", "youtube", "pinterest",
      "twitter", "linkedin", "threads", "facebook",
      "discord", "telegram", "google_business",
    ]) {
      const r = inboxEventSchema.safeParse({ ...valid, platform: p });
      expect(r.success).toBe(true);
    }
  });

  it("rejects unknown platform", () => {
    const r = inboxEventSchema.safeParse({ ...valid, platform: "myspace" });
    expect(r.success).toBe(false);
  });

  it("requires externalId", () => {
    const { externalId, ...rest } = valid;
    const r = inboxEventSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("requires valid ISO sentAt", () => {
    const r = inboxEventSchema.safeParse({ ...valid, sentAt: "yesterday" });
    expect(r.success).toBe(false);
  });

  it("rejects empty body", () => {
    const r = inboxEventSchema.safeParse({ ...valid, body: "" });
    expect(r.success).toBe(false);
  });

  it("rejects body > 8000 chars", () => {
    const r = inboxEventSchema.safeParse({ ...valid, body: "x".repeat(8001) });
    expect(r.success).toBe(false);
  });

  it("accepts DM event with optional conversationId", () => {
    const r = inboxEventSchema.safeParse({ ...valid, type: "message", conversationId: "conv-1" });
    expect(r.success).toBe(true);
  });
});