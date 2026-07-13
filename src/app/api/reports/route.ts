import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listReports, createReport, updateReport } from "@/lib/db/reports";
import { createReportSchema } from "@/lib/validation/reports";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("reports");

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

  const format = parsed.data.format ?? "csv";
  const id = await createReport(session.workspaceId, parsed.data);

  // PDF reports are generated on-demand by the /download route; the client polls
  // this list endpoint until status flips to "ready" (we mark it ready now since
  // there's no async worker for v1). CSV/JSON reports have no downloadUrl —
  // the client exports them via /lib/csv locally from the listed data.
  await updateReport(session.workspaceId, id, { status: "ready" });

  log.info("Report created", {
    reportId: id,
    template: parsed.data.template,
    format,
    workspaceId: session.workspaceId,
  });

  return jsonOk({ id, status: "ready", format }, 201);
}
