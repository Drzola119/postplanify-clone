import {
  access,
  route,
  readProject,
  projectRef,
} from "@/lib/infographic-studio/server";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const { id } = await context.params;
    await readProject(session.workspaceId, id);
    const snap = await projectRef(session.workspaceId, id)
      .collection("versions")
      .orderBy("revision", "desc")
      .limit(20)
      .get();
    return Response.json({ items: snap.docs.map((d) => d.data()) });
  });
}
