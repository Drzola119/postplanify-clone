import { NextRequest, NextResponse } from "next/server";
import { adminDb, getCurrentUser } from "@/lib/firebase/admin";

type Surface = "admin" | "product" | "public";
const FLAG_BY_SURFACE: Record<Surface, string> = {
  admin: "dark_mode_admin",
  product: "dark_mode_product",
  public: "dark_mode_public",
};

function stableBucket(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("surface");
  const surface: Surface = requested === "admin" || requested === "product" || requested === "public" ? requested : "public";
  const flagId = FLAG_BY_SURFACE[surface];
  const user = await getCurrentUser();
  const existingCohort = request.cookies.get("pp_theme_cohort")?.value;
  const cohort = user?.uid ?? existingCohort ?? crypto.randomUUID();
  let enabled = true;
  let rollout = 100;

  if (adminDb) {
    const snap = await adminDb.collection("featureFlags").doc(flagId).get().catch(() => null);
    const data = snap?.data() as { enabled?: boolean; rollout?: number } | undefined;
    if (data) {
      enabled = data.enabled !== false;
      rollout = Math.max(0, Math.min(100, Number(data.rollout ?? 100)));
    }
  }

  const response = NextResponse.json({
    ok: true,
    surface,
    enabled: enabled && stableBucket(cohort) < rollout,
  });
  if (!existingCohort && !user) {
    response.cookies.set("pp_theme_cohort", cohort, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
