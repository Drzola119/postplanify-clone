import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { runAutomationTick } from "@/lib/queue/automation-worker";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export const dynamic = "force-dynamic";

/** Run AutoDM processing for the signed-in workspace only. */
export async function POST(_request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  try {
    const result = await runAutomationTick(session.workspaceId);
    return jsonOk({ result });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Automation tick failed");
  }
}
