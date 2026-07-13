import "server-only";

/**
 * Server-side config loader for integration secrets.
 *
 * Rules:
 *  - Production (NODE_ENV === "production") is env-only: secrets MUST be set
 *    via environment variables. Client-supplied x-* override headers are
 *    dropped. Missing required env → throws "not configured" error.
 *  - Non-production honors client-supplied x-* override headers so devs can
 *    test locally without provisioning server env vars.
 *  - Set ALLOW_CLIENT_OVERRIDES=1 in production to permit client overrides
 *    (NOT recommended; only for staged rollouts / canary debugging).
 *
 * Never echo secrets back to the client. Use require* helpers below.
 */

const isProd = process.env.NODE_ENV === "production";
const forceClientOverrides = process.env.ALLOW_CLIENT_OVERRIDES === "1";

export function isClientOverrideAllowed(): boolean {
  return !isProd || forceClientOverrides;
}

export class MissingServerSecretError extends Error {
  constructor(public readonly secret: string) {
    super(`Server secret "${secret}" is not configured`);
    this.name = "MissingServerSecretError";
  }
}

function readHeader(headers: Headers, name: string): string | null {
  const v = headers.get(name);
  return v && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Resolve a required secret. In production env is mandatory (header ignored).
 * In dev (or when ALLOW_CLIENT_OVERRIDES=1) the header, if present and non-empty,
 * is used as a fallback when env is missing — env wins when both exist.
 */
function resolve(
  secretName: string,
  envVar: string,
  headerName: string,
  headers: Headers
): string {
  const fromEnv = process.env[envVar]?.trim();
  if (fromEnv) return fromEnv;

  if (isClientOverrideAllowed()) {
    const fromHeader = readHeader(headers, headerName);
    if (fromHeader) return fromHeader;
  }

  throw new MissingServerSecretError(secretName);
}

function resolveOptional(envVar: string, headerName: string, headers: Headers): string | undefined {
  const fromEnv = process.env[envVar]?.trim();
  if (fromEnv) return fromEnv;
  if (isClientOverrideAllowed()) {
    const fromHeader = readHeader(headers, headerName);
    if (fromHeader) return fromHeader;
  }
  return undefined;
}

export interface Secrets {
  groqApiKey: string;
  n8nWebhookUrl: string;
  uploadPostApiKey: string;
  bunnyZone?: string;
  bunnyPassword?: string;
}

export function resolveSecrets(headers: Headers): Secrets {
  return {
    groqApiKey: resolve("GROQ_API_KEY", "GROQ_API_KEY", "x-groq-key", headers),
    n8nWebhookUrl: resolve(
      "N8N_WEBHOOK_URL",
      "N8N_WEBHOOK_URL",
      "x-n8n-webhook-url",
      headers
    ),
    uploadPostApiKey: resolve(
      "UPLOAD_POST_API_KEY",
      "UPLOAD_POST_API_KEY",
      "x-upload-post-key",
      headers
    ),
    bunnyZone: resolveOptional("BUNNY_STORAGE_ZONE", "x-bunny-zone", headers),
    bunnyPassword: resolveOptional("BUNNY_STORAGE_PASSWORD", "x-bunny-password", headers),
  };
}

/**
 * Lightweight helpers for the rare case a route only needs one secret.
 * Each accepts a Headers object so the caller can forward the request headers.
 */
export const resolvers = {
  groqApiKey(h: Headers): string {
    return resolve("GROQ_API_KEY", "GROQ_API_KEY", "x-groq-key", h);
  },
  n8nWebhookUrl(h: Headers): string {
    return resolve("N8N_WEBHOOK_URL", "N8N_WEBHOOK_URL", "x-n8n-webhook-url", h);
  },
  uploadPostApiKey(h: Headers): string {
    return resolve("UPLOAD_POST_API_KEY", "UPLOAD_POST_API_KEY", "x-upload-post-key", h);
  },
  bunny(h: Headers): { zone?: string; password?: string } {
    return {
      zone: resolveOptional("BUNNY_STORAGE_ZONE", "x-bunny-zone", h),
      password: resolveOptional("BUNNY_STORAGE_PASSWORD", "x-bunny-password", h),
    };
  },
  apiKeyEncryptionKey(h: Headers): string {
    return resolve("API_KEY_ENCRYPTION_KEY", "API_KEY_ENCRYPTION_KEY", "x-api-key-encryption-key", h);
  },
  sentryDsn(h: Headers): string | undefined {
    return resolveOptional("SENTRY_DSN", "x-sentry-dsn", h);
  },
};
