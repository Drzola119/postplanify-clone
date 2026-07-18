import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { PLANS, createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { planId, successUrl, cancelUrl } = await request.json() as {
    planId?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!planId || !(planId in PLANS)) {
    return jsonError(400, "Invalid plan");
  }
  if (!successUrl || !cancelUrl) {
    return jsonError(400, "Missing successUrl or cancelUrl");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(503, "Billing not configured");
  }

  const plan = PLANS[planId as keyof typeof PLANS];
  const customer = await getOrCreateCustomer(session.uid, session.email ?? "");
  const checkout = await createCheckoutSession(
    customer.id,
    plan.priceId,
    session.workspaceId,
    successUrl,
    cancelUrl,
  );

  return jsonOk({ url: checkout.url });
}
