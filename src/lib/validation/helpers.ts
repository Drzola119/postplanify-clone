import "server-only";
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