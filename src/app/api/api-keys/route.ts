import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listKeys, createKey } from "@/lib/db/api-keys";
import { createApiKeySchema } from "@/lib/validation/api-keys";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("api:api-keys");

export async function GET() {
  try {
    const session = await requireSession();
    if (session instanceof Response) return session;
    const items = await listKeys(session.workspaceId);
    return jsonOk({ keys: items });
  } catch (err) {
    log.error(err, { route: "GET /api/api-keys" });
    return jsonError(500, "Internal server error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session instanceof Response) return session;
    const parsed = await parseBody(request, createApiKeySchema);
    if (!parsed.ok || !parsed.data) {
      return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
    }
    const result = await createKey(session.workspaceId, parsed.data);
    return jsonOk(result, 201);
  } catch (err) {
    log.error(err, { route: "POST /api/api-keys" });
    return jsonError(500, "Internal server error");
  }
}
