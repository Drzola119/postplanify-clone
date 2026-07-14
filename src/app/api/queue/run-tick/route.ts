import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { runQueueTick } from "@/lib/queue/worker";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  try {
    const result = await runQueueTick();
    return jsonOk({ result });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Tick failed");
  }
}
