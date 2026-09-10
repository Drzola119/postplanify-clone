import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listPosts } from "@/lib/db/posts";
import { getWorkerStatusForDashboard } from "@/lib/queue/worker";
import { jsonOk } from "@/lib/validation/helpers";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const [inflightResult, failedResult] = await Promise.all([
    listPosts(session.workspaceId, { status: "publishing", pageSize: 50 }),
    listPosts(session.workspaceId, { status: "failed", pageSize: 20 }),
  ]);

  const health = await getWorkerStatusForDashboard();
  let uploadPostConfigured = false;
  try {
    resolvers.uploadPostApiKey(new Headers());
    uploadPostConfigured = true;
  } catch (err) {
    if (!(err instanceof MissingServerSecretError)) {
      // Surface as not-configured.
    }
  }

  return jsonOk({
    inflight: inflightResult.items,
    failed: failedResult.items,
    health: { ...health, uploadPostConfigured, intervalMs: null },
  });
}
