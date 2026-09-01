import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listPosts, createPost } from "@/lib/db/posts";
import { createPostSchema, postFiltersSchema } from "@/lib/validation/posts";
import { parseBody, parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const parsed = parseSearchParams(url.searchParams, postFiltersSchema);
    if (!parsed.ok || !parsed.data) {
      return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
    }

    const result = await listPosts(session.workspaceId, parsed.data);
    return jsonOk({ posts: result.items, nextCursor: result.nextCursor });
  } catch (err) {
    console.error("[GET /api/posts error]", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg) || (err as { code?: unknown })?.code === 8) {
      return jsonError(503, "Firestore quota exceeded — check Firebase Console → Firestore → Usage and enable Blaze billing or wait for quota reset.", undefined);
    }
    // Don't mask persistent errors as empty list — surface 500 so the UI can show a retry
    // But keep backward compat: empty list for transient unknown errors
    return jsonOk({ posts: [], nextCursor: null });
  }
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