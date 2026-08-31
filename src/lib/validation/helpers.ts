import { ZodSchema, ZodError, z } from "zod";

export type ParseResult<T> =
  | { ok: true; data: T; error?: undefined }
  | { ok: false; data?: undefined; error: { status: number; message: string; issues?: unknown } };

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { ok: false, error: { status: 400, message: "Invalid JSON body" } };
  }
  return parseValue(json, schema);
}

export function parseValue<T>(value: unknown, schema: ZodSchema<T>): ParseResult<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const err = result.error as ZodError;
    return {
      ok: false,
      error: {
        status: 400,
        message: "Validation failed",
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
    };
  }
  return { ok: true, data: result.data };
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ParseResult<T> {
  const obj: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  return parseValue(obj, schema);
}

export function jsonError(status: number, message: string, issues?: unknown): Response {
  return Response.json({ ok: false, error: { status, message, issues } }, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, ...data }, { status });
}

export const stringArray = z.array(z.string().min(1)).max(50);
export const nonEmptyString = z.string().min(1).max(100_000);
export const optionalString = z.string().max(100_000).optional();
export const isoDate = z.string().datetime({ offset: true }).or(z.string());
export const url = z
  .string()
  .url()
  .max(2048)
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "URL must use http or https",
  });
export const urlArray = z
  .array(z.string().url().max(2048).refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "URL must use http or https",
  }))
  .max(10);

/**
 * Shared captionsByPlatform validation used by both /api/posts/publish and
 * /api/posts/schedule. Returns a Response on error, otherwise null.
 * Keeps the two code paths from drifting (gap 3.1 in the original audit).
 */
export function validateCaptionsByPlatform(
  platforms: string[],
  captionsByPlatform: Record<string, string> | undefined,
  sameForAll: boolean | undefined,
  captionFallback: string | undefined
): Response | null {
  const capMap = captionsByPlatform;
  if (sameForAll === false && !capMap) {
    return Response.json({ error: "captionsByPlatform is required when sameForAll is false" }, { status: 400 });
  }
  if (capMap) {
    const known = new Set(platforms);
    for (const k of Object.keys(capMap)) {
      if (k === "__all") continue;
      if (!known.has(k)) return Response.json({ error: `Unknown platform key in captionsByPlatform: ${k}` }, { status: 400 });
    }
    if (sameForAll === false) {
      for (const p of platforms) {
        const v = capMap[p];
        if (v == null || v.trim().length === 0) return Response.json({ error: `Missing caption for platform: ${p}` }, { status: 400 });
      }
    } else if (capMap && sameForAll === true) {
      const shared = capMap.__all ?? capMap[platforms[0]] ?? captionFallback ?? "";
      if (!shared || shared.trim().length === 0) return Response.json({ error: "Missing shared caption" }, { status: 400 });
    }
  }
  return null;
}