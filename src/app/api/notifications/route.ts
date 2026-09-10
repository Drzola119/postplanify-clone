import { requireSession } from "@/lib/auth/session-context";
import { getNotificationFeed } from "@/lib/notifications";
import { jsonOk } from "@/lib/validation/helpers";

export const dynamic = "force-dynamic";

/**
 * Manual, authenticated notification read. There is intentionally no
 * Firestore listener or polling loop attached to this route.
 */
export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const feed = await getNotificationFeed(session.uid);
  return jsonOk(feed);
}
