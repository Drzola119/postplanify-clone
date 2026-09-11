import { z } from "zod";
import {
  access,
  route,
  readProject,
  projectRef,
  db,
  StudioError,
} from "@/lib/infographic-studio/server";
import { exportDocument } from "@/lib/infographic-studio/export";
import { persistGeneratedImage } from "@/lib/image-gen/asset-saver";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const session = await access(true);
    if (session instanceof Response) return session;
    const { id } = await context.params;
    const input = z
      .object({
        revision: z.number().int().positive(),
        format: z.enum(["png", "svg"]),
        save: z.boolean().default(false),
      })
      .parse(await request.json());
    const project = await readProject(session.workspaceId, id);
    if (project.revision !== input.revision)
      throw new StudioError(
        409,
        "Save or reload the current version before exporting.",
      );
    if (!project.document.brief.confirmed)
      throw new StudioError(
        422,
        "Review and confirm your content before exporting.",
      );
    const ref = projectRef(session.workspaceId, id)
      .collection("exports")
      .doc(`${input.revision}-png`);
    if (input.save) {
      const cached = (await ref.get()).data();
      if (cached?.assetId) {
        const asset = await db()
          .doc(
            `workspaces/${session.workspaceId}/mediaAssets/${cached.assetId}`,
          )
          .get();
        if (asset.exists && !asset.data()?.deletedAt)
          return Response.json(cached);
      }
    }
    const { svg, png } = await exportDocument(
      session.workspaceId,
      project.document,
    );
    if (!input.save)
      return new Response(input.format === "svg" ? svg : new Uint8Array(png), {
        headers: {
          "Content-Type":
            input.format === "svg" ? "image/svg+xml" : "image/png",
          "Content-Disposition": `attachment; filename="infographic-v${input.revision}.${input.format}"`,
          "Cache-Control": "no-store",
        },
      });
    const result = await persistGeneratedImage({
      workspaceId: session.workspaceId,
      uid: session.uid,
      bytes: png,
      mime: "image/png",
      width: project.document.width,
      height: project.document.height,
    });
    if (!result.assetId)
      return Response.json(
        {
          error: {
            message:
              "Export rendered and uploaded, but library storage failed. Download the recovery image; do not assume it was saved.",
          },
          recoveryUrl: result.cdnUrl,
        },
        { status: 503 },
      );
    try {
      await db().runTransaction(async (tx) => {
        const snap = await tx.get(projectRef(session.workspaceId, id));
        tx.set(ref, { ...result, revision: input.revision });
        if (snap.data()?.revision === input.revision)
          tx.update(projectRef(session.workspaceId, id), {
            exportAssetId: result.assetId,
            exportRevision: input.revision,
          });
      });
    } catch {
      return Response.json({
        ...result,
        revision: input.revision,
        persistenceWarning:
          "Your image is in the media library, but the project export reference could not be saved. Keep this asset; refreshing the project will not start another generation.",
      });
    }
    return Response.json({ ...result, revision: input.revision });
  });
}
