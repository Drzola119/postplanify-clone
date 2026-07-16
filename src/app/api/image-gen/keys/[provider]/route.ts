import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { deleteImageGenKey } from "@/lib/db/image-gen-keys";
import { imageGenProviderSchema } from "@/lib/validation/image-gen";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { provider } = await context.params;
  const parsed = imageGenProviderSchema.safeParse(provider);
  if (!parsed.success) {
    return jsonError(400, "Unknown provider id");
  }
  await deleteImageGenKey(session.workspaceId, parsed.data);
  return jsonOk({ deleted: true });
}