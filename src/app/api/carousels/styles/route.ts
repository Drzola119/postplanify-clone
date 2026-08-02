/**
 * /api/carousels/styles — Carousel style persistence
 *
 * F2 — Palette Builder's cloud-save feature. The M1 default style lives
 * in a static registry (`src/lib/carousel-gen/styles.ts`); user-built
 * palettes can optionally be persisted to Firestore so they survive
 * across devices, show up in the style picker, and back the analytics
 * page's "Style used" breakdown.
 *
 * GET — list all saved styles for the current workspace.
 * POST — create a new style. The id is client-supplied so the picker
 *   can address the same record across sessions without a server round
 *   trip; the route validates it doesn't collide.
 * DELETE — remove a style by id.
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("api:carousels:styles");

const carouselStyleSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Style id must be alphanumeric, dash, or underscore"),
  label: z.string().min(1).max(80),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
  }),
  fonts: z.object({
    display: z.string().min(1).max(60),
    body: z.string().min(1).max(60),
  }),
  layouts: z.object({
    hook: z.object({ id: z.string(), label: z.string(), description: z.string() }),
    stakes: z.object({ id: z.string(), label: z.string(), description: z.string() }),
    value: z.object({ id: z.string(), label: z.string(), description: z.string() }),
    receipts: z.object({ id: z.string(), label: z.string(), description: z.string() }),
    cta: z.object({ id: z.string(), label: z.string(), description: z.string() }),
  }),
  source: z.enum(["manual", "brand-analyzed", "brand-kit"]),
});

const upsertStyleSchema = z.object({
  style: carouselStyleSchema,
});

const deleteStyleSchema = z.object({
  styleId: z.string().min(1).max(64),
});

export interface SavedCarouselStyle {
  id: string;
  label: string;
  colors: { primary: string; background: string; accent: string };
  fonts: { display: string; body: string };
  layouts: {
    hook: { id: string; label: string; description: string };
    stakes: { id: string; label: string; description: string };
    value: { id: string; label: string; description: string };
    receipts: { id: string; label: string; description: string };
    cta: { id: string; label: string; description: string };
  };
  source: "manual" | "brand-analyzed" | "brand-kit";
  createdAt?: number;
  updatedAt?: number;
}

function stylesCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("carouselStyles");
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  try {
    const snap = await stylesCollection(session.workspaceId).get();
    const styles: SavedCarouselStyle[] = snap.docs.map((d) => {
      const data = d.data() as Omit<SavedCarouselStyle, "id">;
      return { id: d.id, ...data };
    });
    return jsonOk({ styles });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("List styles failed", { workspaceId: session.workspaceId, error: message });
    return jsonError(500, message);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, upsertStyleSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const { style } = parsed.data;

  try {
    const ref = stylesCollection(session.workspaceId).doc(style.id);
    const existing = await ref.get();
    const payload: Omit<SavedCarouselStyle, "id"> = {
      label: style.label,
      colors: style.colors,
      fonts: style.fonts,
      layouts: style.layouts,
      source: style.source,
      updatedAt: Date.now(),
    };
    if (!existing.exists) {
      payload.createdAt = Date.now();
    }
    await ref.set(payload, { merge: true });

    logger.info("Carousel style saved", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      styleId: style.id,
    });

    return jsonOk({ style: { id: style.id, ...payload } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Save style failed", { workspaceId: session.workspaceId, error: message });
    return jsonError(500, message);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  let body: z.infer<typeof deleteStyleSchema>;
  try {
    const raw = (await request.json()) as unknown;
    body = deleteStyleSchema.parse(raw);
  } catch (err) {
    return jsonError(
      400,
      err instanceof Error ? err.message : "Invalid payload"
    );
  }

  try {
    await stylesCollection(session.workspaceId).doc(body.styleId).delete();
    logger.info("Carousel style deleted", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      styleId: body.styleId,
    });
    return jsonOk({ styleId: body.styleId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Delete style failed", { workspaceId: session.workspaceId, error: message });
    return jsonError(500, message);
  }
}

// Suppress unused-import warning — FieldValue is kept for future use
// (e.g. arrayUnion on style tags).
void FieldValue;
