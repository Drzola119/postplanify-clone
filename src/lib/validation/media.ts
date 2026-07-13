import "server-only";
import { z } from "zod";
import { url, optionalString, isoDate } from "./helpers";

export const mediaFolderSchema = z.enum(["posts", "brands", "avatars", "assets"]);
export type MediaFolder = z.infer<typeof mediaFolderSchema>;

export const mediaAssetSchema = z.object({
  url: url,
  storedPath: z.string().min(1).max(512),
  mime: z.string().min(1).max(120),
  size: z.number().int().min(0).max(200 * 1024 * 1024),
  width: z.number().int().min(0).max(20000).optional(),
  height: z.number().int().min(0).max(20000).optional(),
  duration: z.number().min(0).max(86400).optional(),
  tags: z.array(z.string().min(1).max(64)).max(30).optional().default([]),
  folder: mediaFolderSchema,
});

export const mediaAssetListFiltersSchema = z.object({
  folder: mediaFolderSchema.optional(),
  mime: z.string().max(120).optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createMediaAssetSchema = z.object({
  url: url,
  storedPath: z.string().min(1).max(512),
  mime: z.string().min(1).max(120),
  size: z.number().int().min(0).max(200 * 1024 * 1024),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration: z.number().optional(),
  folder: mediaFolderSchema,
  tags: z.array(z.string().min(1).max(64)).max(30).optional().default([]),
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;
export type MediaAssetListFilters = z.infer<typeof mediaAssetListFiltersSchema>;
