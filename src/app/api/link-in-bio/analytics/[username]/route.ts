import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getAnalytics } from "@/lib/db/link-in-bio";
import { jsonOk } from "@/lib/validation/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { username } = await params;
  const data = await getAnalytics(username);
  return jsonOk(data);
}
