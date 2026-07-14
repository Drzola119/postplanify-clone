import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import {
  getAutoDmCampaign,
  updateAutoDmCampaign,
  deleteAutoDmCampaign,
} from "@/lib/db/automations";
import { updateAutoDmSchema } from "@/lib/validation/automations";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const c = await getAutoDmCampaign(session.workspaceId, id);
  if (!c) return jsonError(404, "Campaign not found");
  return jsonOk({ campaign: c });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const c = await getAutoDmCampaign(session.workspaceId, id);
  if (!c) return jsonError(404, "Campaign not found");
  const parsed = await parseBody(request, updateAutoDmSchema);
  if (!parsed.ok) return jsonError(400, "Invalid campaign patch", parsed.error.issues);
  await updateAutoDmCampaign(session.workspaceId, id, parsed.data);
  return jsonOk({ id });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const c = await getAutoDmCampaign(session.workspaceId, id);
  if (!c) return jsonError(404, "Campaign not found");
  await deleteAutoDmCampaign(session.workspaceId, id);
  return jsonOk({ id });
}
