import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listDrafts, saveDraft } from "@/lib/db/drafts";
import { saveDraftSchema } from "@/lib/validation/drafts";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const mineOnly = url.searchParams.get("mine") !== "0";
  const drafts = await listDrafts(session.workspaceId, mineOnly ? session.uid : undefined);
  return jsonOk({ drafts });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, saveDraftSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const id = await saveDraft(session.workspaceId, session.uid, parsed.data);
  return jsonOk({ id }, 201);
}