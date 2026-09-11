import { z } from "zod";
import {
  access,
  route,
  db,
  saveProject,
} from "@/lib/infographic-studio/server";
import { documentSchema, identifier } from "@/lib/infographic-studio/document";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const cursor = new URL(request.url).searchParams.get("cursor");
    let query = db()
      .collection(`workspaces/${session.workspaceId}/infographicProjects`)
      .orderBy("updatedAt", "desc")
      .orderBy("__name__", "desc");
    if (cursor) {
      const snap = await db()
        .doc(
          `workspaces/${session.workspaceId}/infographicProjects/${identifier.parse(cursor)}`,
        )
        .get();
      if (snap.exists) query = query.startAfter(snap);
    }
    const snap = await query.limit(21).get();
    const docs = snap.docs.slice(0, 20);
    return Response.json({
      items: docs.map((d) => ({ ...d.data(), id: d.id })),
      nextCursor: snap.size > 20 ? docs.at(-1)?.id : null,
    });
  });
}
export async function POST(request: Request) {
  return route(async () => {
    const session = await access(true);
    if (session instanceof Response) return session;
    const input = z
      .object({ document: documentSchema })
      .parse(await request.json());
    return Response.json(
      { project: await saveProject(session, input) },
      { status: 201 },
    );
  });
}
