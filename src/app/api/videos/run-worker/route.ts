import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { runVideoRenderTick } from "@/lib/queue/video-render-worker";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export const dynamic = "force-dynamic";

/** Process queued video jobs for the signed-in workspace only. */
export async function POST(_request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  try {
    const result = await runVideoRenderTick(session.workspaceId);
    return jsonOk({ result });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Video worker tick failed");
  }
}
