import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getDestination, updateDestination, deleteDestination } from "@/lib/db/destinations";
import { destinationUpdateSchema } from "@/lib/validation/destinations";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const item = await getDestination(session.workspaceId, id);
  if (!item) return jsonError(404, "Destination not found");
  return jsonOk({ destination: item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  const existing = await getDestination(session.workspaceId, id);
  if (!existing) return jsonError(404, "Destination not found");

  const parsed = await parseBody(request, destinationUpdateSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  await updateDestination(session.workspaceId, id, parsed.data);
  return jsonOk({ updated: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  await deleteDestination(session.workspaceId, id);
  return jsonOk({ deleted: true });
}
