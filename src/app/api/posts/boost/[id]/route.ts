import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const boostSchema = z.object({
  enabled: z.boolean(),
  budgetCents: z.number().int().min(0).max(10_000_00).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  audienceHint: z.string().max(280).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await params;
  const snap = await adminDb.doc(`workspaces/${session.workspaceId}/posts/${id}`).get();
  if (!snap.exists) return jsonError(404, "Post not found");
  const data = snap.data() as { boostConfig?: unknown };
  return jsonOk({ boost: data.boostConfig ?? null });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await params;
  const snap = await adminDb.doc(`workspaces/${session.workspaceId}/posts/${id}`).get();
  if (!snap.exists) return jsonError(404, "Post not found");
  const existing = snap.data() as { status?: string };

  const parsed = await parseBody(request, boostSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  if (parsed.data.enabled) {
    if (existing.status !== "published") {
      return jsonError(409, "Only published posts can be boosted");
    }
    const now = new Date();
    const durationDays = parsed.data.durationDays ?? 7;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const boostConfig = {
      status: "active" as const,
      budgetCents: parsed.data.budgetCents,
      durationDays,
      startedAt: now,
      endsAt,
      audienceHint: parsed.data.audienceHint,
    };
    await adminDb.doc(`workspaces/${session.workspaceId}/posts/${id}`).set(
      { boostConfig, updatedAt: now },
      { merge: true },
    );
    return jsonOk({ boost: boostConfig });
  } else {
    await adminDb.doc(`workspaces/${session.workspaceId}/posts/${id}`).set(
      { boostConfig: { status: "paused" }, updatedAt: new Date() },
      { merge: true },
    );
    return jsonOk({ boost: { status: "paused" } });
  }
}