import { describe, it, expect } from "vitest";
import {
  apiKeyScopeSchema,
  createApiKeySchema,
} from "@/lib/validation/api-keys";
import {
  usernameSchema,
  saveLinkInBioSchema,
  updateLinkInBioSchema,
  socialsSchema,
} from "@/lib/validation/link-in-bio";
import {
  updateProfileSchema,
  changePasswordSchema,
  notificationPrefsSchema,
} from "@/lib/validation/settings";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  workspacePlanSchema,
} from "@/lib/validation/workspaces";
import { parseValue } from "@/lib/validation/helpers";

describe("validation/api-keys - apiKeyScopeSchema", () => {
  it("accepts known scopes", () => {
    ["read:posts", "write:posts", "all"].forEach((s) => {
      expect(apiKeyScopeSchema.safeParse(s).success).toBe(true);
    });
  });
  it("rejects unknown", () => {
    expect(apiKeyScopeSchema.safeParse("delete:everything").success).toBe(false);
  });
});

describe("validation/api-keys - createApiKeySchema", () => {
  it("accepts valid input", () => {
    const r = parseValue(
      { name: "Production", scopes: ["read:posts", "write:posts"] },
      createApiKeySchema
    );
    expect(r.ok).toBe(true);
  });
  it("rejects empty scopes", () => {
    const r = parseValue({ name: "X", scopes: [] }, createApiKeySchema);
    expect(r.ok).toBe(false);
  });
});

describe("validation/link-in-bio - usernameSchema", () => {
  it("accepts valid usernames", () => {
    ["abc", "abc-123", "user_name", "abc123def"].forEach((u) => {
      expect(usernameSchema.safeParse(u).success).toBe(true);
    });
  });
  it("rejects invalid", () => {
    ["ab", "UPPER", "with space", "with.dot", "way-too-long-username-that-exceeds-thirty-chars"].forEach((u) => {
      expect(usernameSchema.safeParse(u).success).toBe(false);
    });
  });
});

describe("validation/link-in-bio - socialsSchema", () => {
  it("accepts URL or handle", () => {
    const r = socialsSchema.safeParse({
      twitter: "https://twitter.com/alice",
      mastodon: "@alice@mastodon.social",
    });
    expect(r.success).toBe(true);
  });
});

describe("validation/link-in-bio - saveLinkInBioSchema", () => {
  it("accepts minimal valid input", () => {
    const r = parseValue({ username: "alice" }, saveLinkInBioSchema);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.bio).toBe("");
      expect(r.data.blocks).toEqual([]);
      expect(r.data.theme).toBe("default");
    }
  });

  it("accepts full input", () => {
    const r = parseValue(
      {
        username: "alice",
        bio: "Hello world",
        blocks: [{ type: "link", data: { url: "https://x.com" } }],
        theme: "dark",
        socials: { twitter: "@alice" },
      },
      saveLinkInBioSchema
    );
    expect(r.ok).toBe(true);
  });
});

describe("validation/link-in-bio - updateLinkInBioSchema", () => {
  it("accepts partial update", () => {
    const r = parseValue({ bio: "New bio" }, updateLinkInBioSchema);
    expect(r.ok).toBe(true);
  });
});

describe("validation/settings - updateProfileSchema", () => {
  it("accepts valid profile", () => {
    const r = parseValue(
      { displayName: "Alice", bio: "Hello", locale: "en-US" },
      updateProfileSchema
    );
    expect(r.ok).toBe(true);
  });
  it("rejects invalid locale", () => {
    const r = parseValue({ locale: "X" }, updateProfileSchema);
    expect(r.ok).toBe(false);
  });
});

describe("validation/settings - changePasswordSchema", () => {
  it("accepts strong password", () => {
    const r = parseValue(
      { currentPassword: "old12345", newPassword: "new12345678" },
      changePasswordSchema
    );
    expect(r.ok).toBe(true);
  });
  it("rejects short new password", () => {
    const r = parseValue(
      { currentPassword: "old", newPassword: "short" },
      changePasswordSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/settings - notificationPrefsSchema", () => {
  it("accepts partial prefs", () => {
    const r = parseValue(
      { emailDigest: true, postFailed: false, emailDigestFrequency: "weekly" },
      notificationPrefsSchema
    );
    expect(r.ok).toBe(true);
  });
});

describe("validation/workspaces - createWorkspaceSchema", () => {
  it("accepts name with default plan", () => {
    const r = parseValue({ name: "My Brand" }, createWorkspaceSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.plan).toBe("free");
  });
  it("rejects empty name", () => {
    const r = parseValue({ name: "" }, createWorkspaceSchema);
    expect(r.ok).toBe(false);
  });
});

describe("validation/workspaces - workspacePlanSchema", () => {
  it("accepts all plans", () => {
    ["free", "pro", "team", "enterprise"].forEach((p) => {
      expect(workspacePlanSchema.safeParse(p).success).toBe(true);
    });
  });
});

describe("validation/workspaces - inviteMemberSchema", () => {
  it("accepts valid invite with default role", () => {
    const r = parseValue({ email: "a@b.com" }, inviteMemberSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.role).toBe("editor");
  });
  it("rejects invalid email", () => {
    const r = parseValue({ email: "not-email" }, inviteMemberSchema);
    expect(r.ok).toBe(false);
  });
});
