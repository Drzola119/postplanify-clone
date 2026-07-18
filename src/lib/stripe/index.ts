import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

export const PLANS = {
  growth: { priceId: process.env.STRIPE_PRICE_GROWTH ?? "", name: "Growth", monthlyCents: 7900 },
  premium: { priceId: process.env.STRIPE_PRICE_PREMIUM ?? "", name: "Premium", monthlyCents: 15900 },
  scale: { priceId: process.env.STRIPE_PRICE_SCALE ?? "", name: "Scale", monthlyCents: 23900 },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [id, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return id as PlanId;
  }
  return null;
}

export async function createCheckoutSession(
  customerId: string | undefined,
  priceId: string,
  workspaceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { workspaceId },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getOrCreateCustomer(uid: string, email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length > 0) return customers.data[0];
  return stripe.customers.create({ email, metadata: { uid } });
}
