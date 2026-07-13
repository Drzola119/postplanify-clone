import "server-only";
import { z } from "zod";
import { urlArray, optionalString } from "./helpers";
import { platformIdSchema } from "./posts";

export const mediaItemSchema = z.object({
  id: z.string().min(1),
  url: z.string().url().or(z.literal("")),
  type: z.enum(["image", "video"]).default("image"),
  name: z.string().max(256).optional(),
  size: z.number().int().min(0).optional(),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
  duration: z.number().min(0).optional(),
});

export const draftCollaboratorSchema = z.object({
  uid: z.string().min(1),
  handle: z.string().min(1).max(64),
  status: z.enum(["invited", "accepted", "declined"]).default("invited"),
});

export const saveDraftSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  caption: optionalString,
  platforms: z.array(platformIdSchema).max(9).optional().default([]),
  mediaItems: z.array(mediaItemSchema).max(20).optional().default([]),
  sameForAll: z.boolean().optional().default(true),
  selected: z.record(z.string(), z.unknown()).optional().default({}),
  collaborators: z.array(draftCollaboratorSchema).max(20).optional().default([]),
  customCoverUrl: optionalString,
  frameCoverUrl: optionalString,
  activeMediaId: optionalString,
  firstComment: optionalString,
  quoteTweetUrl: optionalString,
  community: optionalString,
  tagUsers: z.array(z.string().min(1).max(64)).max(50).optional().default([]),
});

export const updateDraftSchema = saveDraftSchema.partial();

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;