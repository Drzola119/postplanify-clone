import { z } from "zod";
import {
  access,
  route,
  readProject,
  saveProject,
  projectRef,
  StudioError,
} from "@/lib/infographic-studio/server";
import { documentSchema } from "@/lib/infographic-studio/document";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    return Response.json({
      project: await readProject(
        session.workspaceId,
        (await context.params).id,
      ),
    });
  });
}
export async function PATCH(request: Request, context: Context) {
  return route(async () => {
    const session = await access(true);
    if (session instanceof Response) return session;
    const input = z
      .object({ document: documentSchema, revision: z.number().int().min(1) })
      .parse(await request.json());
    return Response.json({
      project: await saveProject(session, {
        ...input,
        id: (await context.params).id,
      }),
    });
  });
}
export async function POST(request: Request, context: Context) {
  return route(async () => {
    const session = await access(true);
    if (session instanceof Response) return session;
    const id = (await context.params).id;
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("duplicate") }),
        z.object({
          action: z.literal("restore"),
          version: z.number().int().positive(),
          revision: z.number().int().positive(),
        }),
      ])
      .parse(await request.json());
    const project = await readProject(session.workspaceId, id);
    if (input.action === "duplicate")
      return Response.json({
        project: await saveProject(session, {
          document: {
            ...project.document,
            title: `${project.title.slice(0, 150)} (copy)`,
          },
        }),
      });
    const version = await projectRef(session.workspaceId, id)
      .collection("versions")
      .doc(String(input.version))
      .get();
    if (!version.exists)
      throw new StudioError(404, "Version no longer available.");
    return Response.json({
      project: await saveProject(session, {
        id,
        revision: input.revision,
        document: documentSchema.parse(version.data()?.document),
      }),
    });
  });
}
