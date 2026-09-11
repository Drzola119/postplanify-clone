import { access, route, db } from "@/lib/infographic-studio/server";
import { identifier } from "@/lib/infographic-studio/document";
export async function GET(request: Request) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const cursor = new URL(request.url).searchParams.get("cursor");
    let query = db()
      .collection(`workspaces/${session.workspaceId}/mediaAssets`)
      .orderBy("__name__");
    if (cursor) query = query.startAfter(identifier.parse(cursor));
    const snap = await query.limit(40).get();
    return Response.json({
      items: snap.docs
        .filter(
          (d) =>
            !d.data().deletedAt &&
            /^image\/(png|jpeg|webp)$/.test(d.data().mime ?? ""),
        )
        .map((d) => ({ id: d.id, url: d.data().url, mime: d.data().mime })),
      nextCursor: snap.size === 40 ? snap.docs.at(-1)?.id : null,
    });
  });
}
