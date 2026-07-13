import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPostMetrics } from "@/lib/db/analytics";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  const metrics = await getPostMetrics(session.workspaceId, id);
  if (!metrics) return jsonError(404, "Metrics not found for this post");
  return jsonOk({ metrics });
}
