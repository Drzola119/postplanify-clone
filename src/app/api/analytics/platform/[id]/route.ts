import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPlatformSeries } from "@/lib/db/analytics";
import { analyticsPlatformQuerySchema } from "@/lib/validation/analytics";
import { platformIdSchema } from "@/lib/validation/posts";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  const platformCheck = platformIdSchema.safeParse(id);
  if (!platformCheck.success) return jsonError(400, "Invalid platform id");

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, analyticsPlatformQuerySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid query");
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return jsonError(400, "Invalid date range");
  }

  const series = await getPlatformSeries(session.workspaceId, platformCheck.data, from, to);
  return jsonOk({ platform: platformCheck.data, series });
}
