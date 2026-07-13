import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listPosts, createPost } from "@/lib/db/posts";
import { createPostSchema, postFiltersSchema } from "@/lib/validation/posts";
import { parseBody, parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, postFiltersSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }

  const result = await listPosts(session.workspaceId, parsed.data);
  return jsonOk({ posts: result.items, nextCursor: result.nextCursor });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, createPostSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const id = await createPost(session.workspaceId, session.uid, parsed.data);
  return jsonOk({ id }, 201);
}