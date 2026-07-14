import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import {
  listAutoDmCampaigns,
  createAutoDmCampaign,
} from "@/lib/db/automations";
import { createAutoDmSchema } from "@/lib/validation/automations";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const result = await listAutoDmCampaigns(session.workspaceId, {
    status: status === "active" || status === "paused" ? status : undefined,
  });
  return jsonOk({ campaigns: result.items, nextCursor: result.nextCursor });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, createAutoDmSchema);
  if (!parsed.ok) return jsonError(400, "Invalid campaign payload", parsed.error.issues);
  const id = await createAutoDmCampaign(session.workspaceId, session.uid, parsed.data);
  return jsonOk({ id }, 201);
}
