import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listSchedules, createSchedule } from "@/lib/db/reports";
import { reportScheduleSchema } from "@/lib/validation/reports";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listSchedules(session.workspaceId);
  return jsonOk({ schedules: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, reportScheduleSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const id = await createSchedule(session.workspaceId, parsed.data);
  return jsonOk({ id }, 201);
}
