import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { isThemePreference, type ThemePreference } from "@/lib/theme/types";

const appearanceSchema = z.object({ theme: z.enum(["light", "dark", "system"]) });

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonOk({ appearance: null });
  const snap = await adminDb.doc(`users/${session.uid}`).get();
  const appearance = snap.data()?.appearance as { theme?: unknown; updatedAt?: unknown } | undefined;
  if (!appearance || !isThemePreference(appearance.theme)) return jsonOk({ appearance: null });
  const updatedAt = appearance.updatedAt && typeof appearance.updatedAt === "object" && "toDate" in appearance.updatedAt
    ? (appearance.updatedAt as { toDate: () => Date }).toDate().toISOString()
    : typeof appearance.updatedAt === "string" ? appearance.updatedAt : new Date(0).toISOString();
  return jsonOk({ appearance: { theme: appearance.theme, updatedAt } });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, appearanceSchema);
  if (!parsed.ok || !parsed.data) return jsonError(400, "Invalid theme preference");
  if (!adminDb) return jsonOk({ appearance: { theme: parsed.data.theme, updatedAt: new Date().toISOString() } });
  const updatedAt = new Date().toISOString();
  await adminDb.doc(`users/${session.uid}`).set({
    appearance: { theme: parsed.data.theme as ThemePreference, updatedAt },
    updatedAt,
  }, { merge: true });
  return jsonOk({ appearance: { theme: parsed.data.theme, updatedAt } });
}
