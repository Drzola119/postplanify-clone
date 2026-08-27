import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkerStatus } from "@/lib/queue/worker";
import { resolvers } from "@/lib/security/server-config";
import { MissingServerSecretError } from "@/lib/security/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  // The worker publishes directly to UploadPost. n8n acknowledgements are
  // intentionally not used as delivery proof anymore.
  let uploadPostConfigured = false;
  try {
    resolvers.uploadPostApiKey(new Headers());
    uploadPostConfigured = true;
  } catch (err) {
    if (!(err instanceof MissingServerSecretError)) {
      // Surface other errors as not-configured rather than 500-ing the dashboard.
    }
  }

  const status = getWorkerStatus();
  return NextResponse.json({
    ...status,
    uploadPostConfigured,
    intervalMs: Number(process.env.WORKER_INTERVAL_MS ?? 30_000),
  });
}
