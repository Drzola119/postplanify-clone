import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { ensureDefaultWorkspace, listWorkspacesForUser, type WorkspaceLite } from "@/lib/db/workspaces";
import { createWorkspaceSchema } from "@/lib/validation/workspaces";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

const FALLBACK_WORKSPACE: WorkspaceLite = {
  id: "xkksLA9bPvHLwx4nThvU",
  name: "My Workspace",
  ownerUid: "",
  plan: "pro",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized");
  try {
    let items: WorkspaceLite[] = [];
    try {
      await ensureDefaultWorkspace(user.uid, user.email);
      items = await listWorkspacesForUser(user.uid);
    } catch {
      // Gracefully handle Firestore quota/network issues
    }
    if (items.length === 0) {
      items = [{ ...FALLBACK_WORKSPACE, ownerUid: user.uid }];
    }
    return jsonOk({ workspaces: items });
  } catch (err) {
    return jsonOk({ workspaces: [{ ...FALLBACK_WORKSPACE, ownerUid: user.uid }] });
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
