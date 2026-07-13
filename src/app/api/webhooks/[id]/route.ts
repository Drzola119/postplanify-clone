import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWebhook, updateWebhook, deleteWebhook } from "@/lib/db/webhooks";
import { webhookUpdateSchema } from "@/lib/validation/destinations";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const item = await getWebhook(session.workspaceId, id);
  if (!item) return jsonError(404, "Webhook not found");
  return jsonOk({ webhook: item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const existing = await getWebhook(session.workspaceId, id);
  if (!existing) return jsonError(404, "Webhook not found");

  const parsed = await parseBody(request, webhookUpdateSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  await updateWebhook(session.workspaceId, id, parsed.data);
  return jsonOk({ updated: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  await deleteWebhook(session.workspaceId, id);
  return jsonOk({ deleted: true });
}
