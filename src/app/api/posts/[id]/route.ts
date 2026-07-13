import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPost, updatePost, softDeletePost } from "@/lib/db/posts";
import { updatePostSchema } from "@/lib/validation/posts";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const post = await getPost(session.workspaceId, id);
  if (!post) return jsonError(404, "Post not found");
  return jsonOk({ post });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  const parsed = await parseBody(request, updatePostSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await updatePost(session.workspaceId, id, parsed.data);
  return jsonOk({ id });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await ctx.params;
  await softDeletePost(session.workspaceId, id);
  return jsonOk({ id, deleted: true });
}