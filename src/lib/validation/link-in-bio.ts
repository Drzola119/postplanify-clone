import "server-only";
import { z } from "zod";
import { url } from "./helpers";

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_-]+$/, "Username must be lowercase alphanumeric, _ or -");

export const linkInBioBlockSchema = z.object({
  type: z.enum(["link", "header", "text", "divider", "social", "embed"]),
  data: z.record(z.unknown()),
});

export const socialsSchema = z.record(
  z
    .string()
    .url()
    .or(z.string().regex(/^@?[a-zA-Z0-9._@-]+$/, "Must be a URL or @handle"))
);

export const saveLinkInBioSchema = z.object({
  username: usernameSchema,
  bio: z.string().max(280).default(""),
  blocks: z.array(linkInBioBlockSchema).max(50).default([]),
  theme: z.string().min(1).max(40).default("default"),
  socials: socialsSchema.optional().default({}),
  avatarUrl: url.optional(),
});

export const updateLinkInBioSchema = saveLinkInBioSchema.partial().extend({
  username: usernameSchema.optional(),
});

export type SaveLinkInBioInput = z.infer<typeof saveLinkInBioSchema>;
export type UpdateLinkInBioInput = z.infer<typeof updateLinkInBioSchema>;
export type LinkInBioBlockInput = z.infer<typeof linkInBioBlockSchema>;
