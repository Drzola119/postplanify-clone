import "server-only";
import { NextRequest } from "next/server";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import {
  listFolders,
  createOrUpdateFolder,
  deleteFolder,
} from "@/lib/carousel-gen/campaign-service";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";
import { documentId } from "@/lib/carousel-gen/document-schema";

const folderSchema = z.object({
  id: documentId.optional(),
  name: z.string().min(1).max(80),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/)
    .optional(),
  icon: z.string().max(30).optional(),
});

export async function GET() {
  const session = await requireSession(false);
  if (session instanceof Response) return session;

  try {
    const folders = await listFolders(session.workspaceId);
    return jsonOk({ folders });
  } catch {
    return jsonError(500, "Failed to load folders");
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, folderSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues,
    );
  }

  try {
    const saved = await createOrUpdateFolder(session.workspaceId, parsed.data);
    return jsonOk({ folder: saved });
  } catch {
    return jsonError(500, "Failed to save folder");
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!documentId.safeParse(id).success)
    return jsonError(400, "Missing folder id");

  try {
    await deleteFolder(session.workspaceId, id!);
    return jsonOk({ success: true });
  } catch {
    return jsonError(500, "Failed to delete folder");
  }
}
