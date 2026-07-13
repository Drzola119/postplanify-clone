import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listKeys, createKey } from "@/lib/db/api-keys";
import { createApiKeySchema } from "@/lib/validation/api-keys";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listKeys(session.workspaceId);
  return jsonOk({ keys: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, createApiKeySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const result = await createKey(session.workspaceId, parsed.data);
  return jsonOk(result, 201);
}
