import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPost, updatePost, softDeletePost } from "@/lib/db/posts";
import { createLogger } from "@/lib/log";

const log = createLogger("posts/scheduled/[id]");

interface PatchBody {
  scheduledAt?: string;
  status?: "scheduled" | "queued" | "paused";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;

  const post = await getPost(session.workspaceId, id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status !== "scheduled" && post.status !== "queued" && post.status !== "paused") {
    return NextResponse.json(
      { error: `Post is in status '${post.status}' and cannot be edited here.` },
      { status: 409 }
    );
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (typeof body.scheduledAt === "string") {
    const t = Date.parse(body.scheduledAt);
    if (Number.isNaN(t)) {
      return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
    }
    if (body.status === "paused") {
      // Resuming: keep the new time but mark queued so the worker picks it up.
      patch.scheduledAt = new Date(t);
      patch.status = "queued";
    } else {
      patch.scheduledAt = new Date(t);
      patch.status = "scheduled";
    }
  }

  if (typeof body.status === "string") {
    if (body.status === "paused") {
      if (post.status !== "scheduled" && post.status !== "queued") {
        return NextResponse.json(
          { error: "Only scheduled or queued posts can be paused." },
          { status: 409 }
        );
      }
      patch.status = "paused";
    } else if (body.status === "scheduled" || body.status === "queued") {
      if (post.status !== "paused" && body.status === "queued") {
        // Allow queued → scheduled transition (reschedule without resume)
        patch.status = body.status;
      } else if (post.status === "paused") {
        // Resume from paused
        patch.status = body.status;
      }
    } else {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await updatePost(session.workspaceId, id, patch);
  } catch (err) {
    log.error("update failed", { err, postId: id });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const updated = await getPost(session.workspaceId, id);
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;

  const post = await getPost(session.workspaceId, id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.status === "publishing") {
    return NextResponse.json(
      { error: "Cannot cancel a post that is currently publishing." },
      { status: 409 }
    );
  }

  try {
    await softDeletePost(session.workspaceId, id);
  } catch (err) {
    log.error("cancel failed", { err, postId: id });
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}