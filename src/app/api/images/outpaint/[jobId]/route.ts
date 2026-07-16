import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { EngineError, getOutpaintJob } from "@/lib/images/engine-client";
import { createLogger } from "@/lib/log";

const log = createLogger("api/images/outpaint/[jobId]");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/images/outpaint/[jobId]
 *
 * Polls the engine for the current job status and per-variant URLs.
 * Returns the engine's payload with platform ids translated from engine
 * canonical ("x") to trustiify ("twitter") naming.
 *
 * 200: { jobId, status, platforms, ratioGroups, variants[] }
 * 404: job not found
 * 502: engine unreachable or returned non-2xx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Firebase ID token in Authorization header" },
      { status: 401 }
    );
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Empty Firebase ID token" }, { status: 401 });
  }

  try {
    const result = await getOutpaintJob(jobId, idToken);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EngineError) {
      if (err.status === 404) {
        return NextResponse.json({ error: "Outpaint job not found" }, { status: 404 });
      }
      log.warn(`[api/images/outpaint/[jobId]] engine error ${err.status}`, {
        status: err.status,
        jobId,
        body: err.body,
      });
      return NextResponse.json(
        { error: err.message, engineStatus: err.status, engineBody: err.body },
        { status: 502 }
      );
    }
    log.error("[api/images/outpaint/[jobId]] unexpected error", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}