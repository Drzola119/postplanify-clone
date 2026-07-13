import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listLabels, createLabel } from "@/lib/db/labels";
import { createLabelSchema } from "@/lib/validation/labels";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listLabels(session.workspaceId);
  return jsonOk({ labels: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, createLabelSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const id = await createLabel(session.workspaceId, parsed.data);
  return jsonOk({ id }, 201);
}
