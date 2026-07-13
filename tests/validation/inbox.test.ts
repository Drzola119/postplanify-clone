import { describe, it, expect } from "vitest";
import {
  inboxCommentFilterSchema,
  inboxMessageFilterSchema,
  inboxReplySchema,
  inboxInboundSchema,
  conversationMessageSchema,
} from "@/lib/validation/inbox";
import { parseValue, parseSearchParams } from "@/lib/validation/helpers";

describe("validation/inbox - inboxCommentFilterSchema", () => {
  it("applies default pageSize", () => {
    const r = parseSearchParams(new URLSearchParams(""), inboxCommentFilterSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.pageSize).toBe(25);
  });

  it("rejects pageSize > 100", () => {
    const r = parseSearchParams(new URLSearchParams("pageSize=500"), inboxCommentFilterSchema);
    expect(r.ok).toBe(false);
  });

  it("coerces replied from string", () => {
    const r = parseSearchParams(new URLSearchParams("replied=true"), inboxCommentFilterSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.replied).toBe(true);
  });
});

describe("validation/inbox - inboxReplySchema", () => {
  it("accepts a valid reply", () => {
    const r = parseValue(
      { platform: "twitter", commentId: "c1", body: "Thanks!" },
      inboxReplySchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects empty body", () => {
    const r = parseValue(
      { platform: "twitter", commentId: "c1", body: "" },
      inboxReplySchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects unknown platform", () => {
    const r = parseValue(
      { platform: "mastodon", commentId: "c1", body: "x" },
      inboxReplySchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/inbox - inboxInboundSchema", () => {
  it("accepts with optional fields", () => {
    const r = parseValue(
      {
        platform: "instagram",
        authorHandle: "alice",
        body: "love it",
        externalId: "ext-1",
      },
      inboxInboundSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects missing authorHandle", () => {
    const r = parseValue(
      { platform: "twitter", body: "x" },
      inboxInboundSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/inbox - inboxMessageFilterSchema", () => {
  it("defaults unreadOnly=false", () => {
    const r = parseSearchParams(new URLSearchParams(""), inboxMessageFilterSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.unreadOnly).toBe(false);
  });
});

describe("validation/inbox - conversationMessageSchema", () => {
  it("defaults direction to out", () => {
    const r = parseValue(
      { conversationId: "c1", body: "hi" },
      conversationMessageSchema
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.direction).toBe("out");
  });
});
