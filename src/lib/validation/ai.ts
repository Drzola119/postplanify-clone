import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";

const MAX_CAPTION_LEN = 22000;
const MAX_HASHTAG_OUTPUT = 30;

export const hashtagSuggestionSchema = z.object({
  caption: z.string().min(1).max(MAX_CAPTION_LEN),
  platforms: z.array(platformIdSchema).max(9).optional(),
  count: z.number().int().min(1).max(MAX_HASHTAG_OUTPUT).optional().default(10),
  locale: z.string().max(8).optional(),
});

export const altTextSchema = z.object({
  imageUrl: z.string().min(1).max(2_000_000), // allow data URIs
  context: z.string().max(500).optional(),
  tone: z.enum(["concise", "detailed", "accessible"]).optional().default("concise"),
});

export const sentimentSchema = z.object({
  text: z.string().min(1).max(4000),
});

export type HashtagSuggestionInput = z.infer<typeof hashtagSuggestionSchema>;
export type AltTextInput = z.infer<typeof altTextSchema>;
export type SentimentInput = z.infer<typeof sentimentSchema>;
