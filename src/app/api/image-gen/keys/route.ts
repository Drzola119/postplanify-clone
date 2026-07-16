import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import {
  listImageGenKeys,
  saveImageGenKey,
} from "@/lib/db/image-gen-keys";
import { saveImageGenKeySchema } from "@/lib/validation/image-gen";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listImageGenKeys(session.workspaceId);
  return jsonOk({ keys: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, saveImageGenKeySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  // Never echo the apiKey back in the response — return only the masked hint.
  const result = await saveImageGenKey(session.workspaceId, parsed.data.provider, parsed.data.apiKey);
  return jsonOk(result, 201);
}