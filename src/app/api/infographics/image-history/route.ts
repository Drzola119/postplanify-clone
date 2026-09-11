import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  access,
  db,
  route,
  StudioError,
} from "@/lib/infographic-studio/server";
import { identifier } from "@/lib/infographic-studio/document";

const toolSchema = z.enum(["instant", "ads"]);
export async function GET(request: Request) {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const tool = toolSchema.parse(
      new URL(request.url).searchParams.get("tool"),
    );
    const snap = await db()
      .doc(
        `workspaces/${session.workspaceId}/infographicImageHistory/${session.uid}-${tool}`,
      )
      .get();
    return Response.json({ mode: "image", items: snap.data()?.items ?? [] });
  });
}
export async function POST(request: Request) {
  return route(async () => {
    const session = await access(true);
    if (session instanceof Response) return session;
    const input = z
      .object({ tool: toolSchema, operationId: identifier })
      .parse(await request.json());
    const ref = db().doc(
      `workspaces/${session.workspaceId}/infographicImageHistory/${session.uid}-${input.tool}`,
    );
    const result = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const items = (snap.data()?.items ?? []) as Array<{
        operationId: string;
        assetId: string;
      }>;
      const previous = items.find(
        (item) => item.operationId === input.operationId,
      );
      if (!previous)
        throw new StudioError(
          404,
          "This image version is no longer in the retained history.",
        );
      const restored = {
        ...previous,
        operationId: randomUUID(),
        restoredFrom: previous.operationId,
        createdAt: new Date().toISOString(),
      };
      tx.set(ref, {
        items: [restored, ...items].slice(0, 20),
        updatedAt: restored.createdAt,
      });
      return restored;
    });
    return Response.json({ result });
  });
}
