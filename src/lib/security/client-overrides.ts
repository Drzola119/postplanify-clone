"use client";

import { clientOverridesAllowed } from "@/lib/security/dev-only";

/**
 * Client-side overrides are intended for local development and preview
 * environments only. In production they are stripped at the server boundary
 * (see `src/lib/security/server-config.ts`) and these keys are simply not
 * consumed. The settings page therefore writes them to a "dev"-prefixed
 * slot so it's clear they're not authoritative.
 */

const STORAGE_KEY = "pp.dev.settings.overrides.v1";

interface OverrideShape {
  uploadPostKey?: string;
  n8nWebhookUrl?: string;
  bunnyZone?: string;
  bunnyPassword?: string;
}

export function readDevOverrides(): OverrideShape {
  if (typeof window === "undefined") return {};
  if (!clientOverridesAllowed()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideShape) : {};
  } catch {
    return {};
  }
}

export function writeDevOverrides(next: OverrideShape): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned: OverrideShape = {};
    if (next.uploadPostKey?.trim()) cleaned.uploadPostKey = next.uploadPostKey.trim();
    if (next.n8nWebhookUrl?.trim()) cleaned.n8nWebhookUrl = next.n8nWebhookUrl.trim();
    if (next.bunnyZone?.trim()) cleaned.bunnyZone = next.bunnyZone.trim();
    if (next.bunnyPassword?.trim()) cleaned.bunnyPassword = next.bunnyPassword.trim();
    if (Object.keys(cleaned).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch {
    // Storage may be disabled / quota exhausted; ignore.
  }
}

export function getOverrideHeaders(): Record<string, string> {
  const o = readDevOverrides();
  const headers: Record<string, string> = {};
  if (o.uploadPostKey) headers["X-Upload-Post-Key"] = o.uploadPostKey;
  if (o.n8nWebhookUrl) headers["X-N8N-Webhook-Url"] = o.n8nWebhookUrl;
  if (o.bunnyZone) headers["X-Bunny-Zone"] = o.bunnyZone;
  if (o.bunnyPassword) headers["X-Bunny-Password"] = o.bunnyPassword;
  return headers;
}
