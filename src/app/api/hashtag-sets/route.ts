import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listSets, createSet } from "@/lib/db/hashtags";
import { createHashtagSetSchema } from "@/lib/validation/hashtags";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listSets(session.workspaceId);
  return jsonOk({ sets: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, createHashtagSetSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const id = await createSet(session.workspaceId, parsed.data);
  return jsonOk({ id }, 201);
}
