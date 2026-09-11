import {
  access,
  route,
  db,
  StudioError,
} from "@/lib/infographic-studio/server";
import { identifier } from "@/lib/infographic-studio/document";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const id = identifier.parse((await context.params).id);
    const snap = await db()
      .doc(`workspaces/${session.workspaceId}/infographicOperations/${id}`)
      .get();
    if (!snap.exists || snap.data()?.uid !== session.uid)
      throw new StudioError(404, "Operation not found.");
    const { status, result, error, createdAt } = snap.data()!;
    return Response.json({ status, result, error, createdAt });
  });
}
