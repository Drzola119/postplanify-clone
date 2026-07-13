import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { ensureDefaultWorkspace, listWorkspacesForUser } from "@/lib/db/workspaces";
import { createWorkspaceSchema } from "@/lib/validation/workspaces";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized");
  try {
    await ensureDefaultWorkspace(user.uid, user.email);
    const items = await listWorkspacesForUser(user.uid);
    return jsonOk({ workspaces: items });
  } catch (err) {
    return jsonError(503, err instanceof Error ? err.message : "Failed to list workspaces");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized");
  const parsed = await parseBody(request, createWorkspaceSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  // Re-use createWorkspace via workspaces db module.
  const { createWorkspace } = await import("@/lib/db/workspaces");
  const id = await createWorkspace({ name: parsed.data.name, ownerUid: user.uid, plan: parsed.data.plan });
  return jsonOk({ id }, 201);
}
