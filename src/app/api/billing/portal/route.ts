import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const portalSchema = z.object({
  returnUrl: z.string().url().max(2048).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(503, "Billing not configured");
  }

  const { getStripe, createPortalSession } = await import("@/lib/stripe");

  const parsed = await parseBody(request, portalSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, "Invalid request body");
  }
  const returnUrl = parsed.data.returnUrl;
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: session.email ?? "", limit: 1 });
  if (customers.data.length === 0) {
    return jsonError(404, "No billing account found");
  }

  const portal = await createPortalSession(customers.data[0].id, returnUrl ?? "/dashboard/settings");
  return jsonOk({ url: portal.url });
}
