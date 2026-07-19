import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.string().url().max(2048),
  cancelUrl: z.string().url().max(2048),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(503, "Billing not configured");
  }

  const parsed = await parseBody(request, checkoutSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, "Invalid payload", parsed.error?.issues);
  }
  const { planId, successUrl, cancelUrl } = parsed.data;

  const { PLANS, createCheckoutSession, getOrCreateCustomer } = await import("@/lib/stripe");

  if (!(planId in PLANS)) {
    return jsonError(400, "Invalid plan");
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
