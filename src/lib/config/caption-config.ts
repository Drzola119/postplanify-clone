import "server-only";

/**
 * Centralized configuration for xAI Grok API, Caption Queue, Rate Limiting, and Worker Scheduling.
 * All rate limits, timeouts, buffers, and model settings are centralized here.
 */

export const CAPTION_CONFIG = {
  // Provider & Endpoint Configuration
  XAI_BASE_URL: process.env.XAI_BASE_URL ?? "https://api.x.ai/v1",
  XAI_MODEL: process.env.XAI_CAPTION_MODEL ?? "grok-2-latest",
  XAI_VISION_MODEL: process.env.XAI_VISION_MODEL ?? "grok-2-vision-latest",
  GROQ_FALLBACK_TEXT_MODEL: process.env.GROQ_FALLBACK_TEXT_MODEL ?? "llama-3.1-8b-instant",
  GROQ_FALLBACK_VISION_MODEL: process.env.GROQ_FALLBACK_VISION_MODEL ?? "llama-3.2-11b-vision-preview",

  // Global Rate Limiting & Safety Headroom
  SAFETY_FACTOR: Number(process.env.XAI_SAFETY_FACTOR ?? 0.7), // 70% safe headroom
  MAX_RPS: Number(process.env.XAI_RPS_LIMIT ?? 30),
  SAFE_RPS: Number(process.env.XAI_SAFE_RPS ?? 20),
  MAX_TPM: Number(process.env.XAI_TPM_LIMIT ?? 70_000),
  SAFE_TPM: Number(process.env.XAI_SAFE_TPM ?? 50_000),

  // Concurrency Controls
  MAX_GLOBAL_CONCURRENCY: Number(process.env.XAI_MAX_CONCURRENCY ?? 10),
  MAX_PER_USER_CONCURRENCY: Number(process.env.XAI_PER_USER_CONCURRENCY ?? 2),

  // Generation Deadlines & Buffers (in minutes)
  TARGET_BUFFER_MINUTES: Number(process.env.CAPTION_TARGET_BUFFER_MINUTES ?? 30), // Target readiness before publish
  EMERGENCY_BUFFER_MINUTES: Number(process.env.CAPTION_EMERGENCY_BUFFER_MINUTES ?? 10), // Emergency priority threshold
  EARLY_GENERATION_LOOKAHEAD_HOURS: Number(process.env.CAPTION_LOOKAHEAD_HOURS ?? 24), // How far ahead to schedule

  // Queue & Worker Parameters
  WORKER_POLL_INTERVAL_MS: Number(process.env.CAPTION_WORKER_INTERVAL_MS ?? 15_000),
  PROCESSING_TIMEOUT_MS: Number(process.env.CAPTION_PROCESSING_TIMEOUT_MS ?? 5 * 60_000), // Lease duration
  REQUEST_TIMEOUT_MS: Number(process.env.CAPTION_REQUEST_TIMEOUT_MS ?? 30_000),
  MAX_ATTEMPTS: Number(process.env.CAPTION_MAX_ATTEMPTS ?? 3),
  BASE_BACKOFF_MS: Number(process.env.CAPTION_BASE_BACKOFF_MS ?? 2_000),
  MAX_BACKOFF_MS: Number(process.env.CAPTION_MAX_BACKOFF_MS ?? 60_000),

  // Token Budgets
  MAX_OUTPUT_TOKENS: Number(process.env.CAPTION_MAX_OUTPUT_TOKENS ?? 600),
  ESTIMATED_TOKENS_PER_REQUEST: Number(process.env.CAPTION_ESTIMATED_TOKENS ?? 1_200),

  // Prompt Versioning
  PROMPT_VERSION: "caption-v1",
} as const;

export type CaptionConfig = typeof CAPTION_CONFIG;
