import { describe, it, expect } from "vitest";
import { campaignMatchesComment, campaignMatchesDm } from "@/lib/queue/automation-worker";
import type { AutoDmCampaignItem } from "@/lib/db/automations";

const baseCampaign: AutoDmCampaignItem = {
  id: "c1",
  workspaceId: "ws1",
  name: "INFO reply",
  status: "active",
  trigger: { kind: "comment-keyword", keyword: "INFO", match: "contains" },
  platforms: ["instagram", "twitter"],
  template: "Here's your link: {{link}}",
  triggered: 0,
  sent: 0,
  skipped: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("automation-worker - campaignMatchesComment", () => {
  it("matches contains keyword case-insensitively", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "comment-keyword", keyword: "info", match: "contains" },
    };
    expect(campaignMatchesComment(c, {
      platform: "instagram",
      body: "please send INFO about pricing",
    })).toBe(true);
  });

  it("does NOT match when keyword is missing", () => {
    expect(campaignMatchesComment(baseCampaign, {
      platform: "instagram",
      body: "love this!",
    })).toBe(false);
  });

  it("respects 'exact' match mode", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "comment-keyword", keyword: "INFO", match: "exact" },
    };
    expect(campaignMatchesComment(c, { platform: "twitter", body: "INFO" })).toBe(true);
    expect(campaignMatchesComment(c, { platform: "twitter", body: "INFO please" })).toBe(false);
  });

  it("respects 'starts-with' match mode", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "comment-keyword", keyword: "INFO", match: "starts-with" },
    };
    expect(campaignMatchesComment(c, { platform: "twitter", body: "  INFO me" })).toBe(true);
    expect(campaignMatchesComment(c, { platform: "twitter", body: "send INFO" })).toBe(false);
  });

  it("respects platform list", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      platforms: ["linkedin"],
    };
    expect(campaignMatchesComment(c, {
      platform: "instagram",
      body: "INFO",
    })).toBe(false);
    expect(campaignMatchesComment(c, {
      platform: "linkedin",
      body: "INFO",
    })).toBe(true);
  });

  it("matches first-comment trigger without postId (any post)", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "first-comment" },
    };
    expect(campaignMatchesComment(c, { platform: "twitter", body: "first!" })).toBe(true);
  });

  it("matches first-comment trigger with postId constraint", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "first-comment", postId: "post-42" },
    };
    expect(campaignMatchesComment(c, { platform: "twitter", postId: "post-42", body: "x" })).toBe(true);
    expect(campaignMatchesComment(c, { platform: "twitter", postId: "post-99", body: "x" })).toBe(false);
  });

  it("matches follow trigger only when metadata.kind === 'follow'", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "follow" },
    };
    expect(campaignMatchesComment(c, { platform: "twitter", metadata: { kind: "follow" } })).toBe(true);
    expect(campaignMatchesComment(c, { platform: "twitter", metadata: { kind: "comment" } })).toBe(false);
    expect(campaignMatchesComment(c, { platform: "twitter" })).toBe(false);
  });
});

describe("automation-worker - campaignMatchesDm", () => {
  it("matches first-comment DM campaign without postId", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "first-comment" },
    };
    expect(campaignMatchesDm(c, { platform: "twitter" })).toBe(true);
  });

  it("rejects non-first-comment DM triggers", () => {
    const c: AutoDmCampaignItem = {
      ...baseCampaign,
      trigger: { kind: "comment-keyword", keyword: "INFO" },
    };
    expect(campaignMatchesDm(c, { platform: "twitter" })).toBe(false);
  });
});