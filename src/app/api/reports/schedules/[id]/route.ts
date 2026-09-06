import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { deleteSchedule, updateSchedule } from "@/lib/db/reports";
import { updateReportScheduleSchema } from "@/lib/validation/reports";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!id) return jsonError(400, "Missing schedule id");
  const parsed = await parseBody(request, updateReportScheduleSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await updateSchedule(session.workspaceId, id, parsed.data);
  return jsonOk({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!id) return jsonError(400, "Missing schedule id");
  await deleteSchedule(session.workspaceId, id);
  return jsonOk({ id });
}
