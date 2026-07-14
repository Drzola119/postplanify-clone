import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkerStatus } from "@/lib/queue/worker";
import { resolvers } from "@/lib/security/server-config";
import { MissingServerSecretError } from "@/lib/security/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  // Confirm the worker has a valid n8n URL to call (it would silently fail otherwise).
  let n8nConfigured = false;
  try {
    resolvers.n8nWebhookUrl(new Headers());
    n8nConfigured = true;
  } catch (err) {
    if (!(err instanceof MissingServerSecretError)) {
      // Surface other errors as not-configured rather than 500-ing the dashboard.
    }
  }

  const status = getWorkerStatus();
  return NextResponse.json({
    ...status,
    n8nConfigured,
    intervalMs: Number(process.env.WORKER_INTERVAL_MS ?? 30_000),
  });
}