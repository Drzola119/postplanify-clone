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
      .doc(`workspaces/${session.workspaceId}/mediaAssets/${id}`)
      .get();
    if (
      !snap.exists ||
      snap.data()?.deletedAt ||
      !/^image\//.test(snap.data()?.mime ?? "")
    )
      throw new StudioError(404, "Image not found in this workspace.");
    return Response.json({ asset: { ...snap.data(), id } });
  });
}
