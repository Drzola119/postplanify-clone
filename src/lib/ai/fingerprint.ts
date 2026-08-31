import "server-only";
import { createHash } from "crypto";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import type { CaptionJobInputSnapshot } from "@/lib/db/schema";

export interface ContentHashInput {
  mediaUrls?: string[];
  imageUrl?: string | null;
  videoTitle?: string | null;
  filename?: string;
  extra?: string;
}

export interface ConfigHashInput {
  tone?: string;
  voice?: string | null;
  template?: string | null;
  includeHashtags?: boolean;
  useEmojis?: boolean;
  multiPlatform?: boolean;
  extra?: string;
  platforms?: Array<{ id: string; name?: string; charLimit?: number }>;
  promptVersion?: string;
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Normalizes and hashes content-identifying fields.
 * Volatile scheduling metadata (scheduledAt, timestamps) MUST NOT be included.
 */
export function calculateContentHash(input: ContentHashInput): string {
  const normalized = {
    mediaUrls: (input.mediaUrls ?? []).filter(Boolean).sort(),
    imageUrl: input.imageUrl?.trim() || null,
    videoTitle: input.videoTitle?.trim().toLowerCase() || null,
    filename: input.filename?.trim().toLowerCase() || null,
  };
  return sha256(JSON.stringify(normalized));
}

/**
 * Normalizes and hashes generation-configuration fields (tone, brand voice, template, etc.).
 */
export function calculateGenerationConfigHash(input: ConfigHashInput): string {
  const normalized = {
    tone: (input.tone ?? "default").trim().toLowerCase(),
    voice: input.voice?.trim().toLowerCase() || null,
    template: input.template?.trim().toLowerCase() || null,
    includeHashtags: !!input.includeHashtags,
    useEmojis: !!input.useEmojis,
    multiPlatform: input.multiPlatform ?? false,
    extra: input.extra?.trim() || null,
    platforms: (input.platforms ?? [])
      .map((p) => p.id)
      .sort(),
    promptVersion: input.promptVersion ?? CAPTION_CONFIG.PROMPT_VERSION,
  };
  return sha256(JSON.stringify(normalized));
}

/**
 * Computes a unique deterministic fingerprint for a caption generation job or cache entry.
 */
export function calculateCaptionFingerprint(params: {
  contentHash?: string;
  generationConfigHash?: string;
  inputSnapshot?: CaptionJobInputSnapshot;
  promptVersion?: string;
}): {
  contentHash: string;
  generationConfigHash: string;
  fingerprint: string;
} {
  const promptVersion = params.promptVersion ?? CAPTION_CONFIG.PROMPT_VERSION;

  const contentHash =
    params.contentHash ??
    calculateContentHash({
      mediaUrls: params.inputSnapshot?.mediaUrls,
      imageUrl: params.inputSnapshot?.imageUrl,
      videoTitle: params.inputSnapshot?.videoTitle,
      filename: params.inputSnapshot?.filename,
      extra: params.inputSnapshot?.extra,
    });

  const generationConfigHash =
    params.generationConfigHash ??
    calculateGenerationConfigHash({
      tone: params.inputSnapshot?.tone,
      voice: params.inputSnapshot?.voice,
      template: params.inputSnapshot?.template,
      includeHashtags: params.inputSnapshot?.includeHashtags,
      useEmojis: params.inputSnapshot?.useEmojis,
      multiPlatform: params.inputSnapshot?.multiPlatform,
      extra: params.inputSnapshot?.extra,
      platforms: params.inputSnapshot?.platforms,
      promptVersion,
    });

  const fingerprint = sha256(`${contentHash}:${generationConfigHash}:${promptVersion}`);

  return {
    contentHash,
    generationConfigHash,
    fingerprint,
  };
}
