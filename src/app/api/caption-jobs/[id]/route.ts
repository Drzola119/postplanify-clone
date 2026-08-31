import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getCaptionJob } from "@/lib/db/caption-jobs";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";
import { adminDb, FieldValue } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["retry", "cancel"]),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (session instanceof Response) return session;

    const { id } = await context.params;
    const job = await getCaptionJob(id);

    if (!job) {
      return jsonError(404, "Caption job not found");
    }

    if (job.workspaceId !== session.workspaceId) {
      return jsonError(403, "Forbidden");
    }

    return jsonOk({ job });
  } catch (err) {
    console.error("[GET /api/caption-jobs/:id error]", err);
    return jsonError(500, err instanceof Error ? err.message : "Failed to retrieve caption job");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (session instanceof Response) return session;

    const { id } = await context.params;
    const job = await getCaptionJob(id);

    if (!job) {
      return jsonError(404, "Caption job not found");
    }

    if (job.workspaceId !== session.workspaceId) {
      return jsonError(403, "Forbidden");
    }

    const parsed = await parseBody(request, actionSchema);
    if (!parsed.ok || !parsed.data) {
      return jsonError(400, "Invalid action payload");
    }

    const coll = adminDb!.collection("captionJobs");

    if (parsed.data.action === "retry") {
      await coll.doc(id).update({
        status: "ready_to_run",
        nextAttemptAt: null,
        workerId: null,
        claimedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ message: "Caption job requeued for generation" });
    }

    if (parsed.data.action === "cancel") {
      await coll.doc(id).update({
        status: "cancelled",
        workerId: null,
        claimedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ message: "Caption job cancelled" });
    }

    return jsonError(400, "Unsupported action");
  } catch (err) {
    console.error("[POST /api/caption-jobs/:id error]", err);
    return jsonError(500, err instanceof Error ? err.message : "Failed to update caption job");
  }
}
