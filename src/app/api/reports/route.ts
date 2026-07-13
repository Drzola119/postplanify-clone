import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listReports, createReport, updateReport } from "@/lib/db/reports";
import { createReportSchema } from "@/lib/validation/reports";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listReports(session.workspaceId);
  return jsonOk({ reports: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, createReportSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const id = await createReport(session.workspaceId, parsed.data);
  // MVP: mark as ready immediately with no downloadUrl. PDF generation is
  // out of scope for v1 — see plan.
  await updateReport(session.workspaceId, id, { status: "ready" });
  return jsonOk({ id }, 201);
}
