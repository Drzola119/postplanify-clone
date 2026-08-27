import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { parseBody } from "@/lib/validation/helpers";
import { reconcileUploadPost } from "@/lib/uploadpost/reconcile";

const payloadSchema = z.object({ postId: z.string().min(1) });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, payloadSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (error) {
    if (error instanceof MissingServerSecretError) {
      return NextResponse.json({ error: `${error.secret} not configured on server` }, { status: 500 });
    }
    throw error;
  }

  try {
    const result = await reconcileUploadPost({
      apiKey,
      workspaceId: session.workspaceId,
      postId: parsed.data.postId,
    });
    return NextResponse.json({ ok: true, ...result }, { status: result.final ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check UploadPost status";
    const status = message === "Post not found" ? 404 : message.includes("no UploadPost request") ? 409 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
