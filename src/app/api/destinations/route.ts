import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listDestinations, createDestination } from "@/lib/db/destinations";
import { destinationSchema } from "@/lib/validation/destinations";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const items = await listDestinations(session.workspaceId);
  return jsonOk({ destinations: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, destinationSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const id = await createDestination(session.workspaceId, parsed.data);
  return jsonOk({ id }, 201);
}
