import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getOverview } from "@/lib/db/analytics";
import { analyticsOverviewQuerySchema } from "@/lib/validation/analytics";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, analyticsOverviewQuerySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid query");
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return jsonError(400, "Invalid date range");
  }

  const overview = await getOverview(session.workspaceId, from, to);
  return jsonOk({ overview });
}
