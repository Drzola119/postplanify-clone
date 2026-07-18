import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { adminDb } from "@/lib/db";
import { createLogger } from "@/lib/log";

export const runtime = "nodejs";

const log = createLogger("billing-webhook");

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object;
    const workspaceId = checkout.metadata?.workspaceId;
    if (workspaceId && adminDb && checkout.subscription) {
      const subId = typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subId);
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? getPlanByPriceId(priceId) : null;
      if (plan) {
        await adminDb.collection("workspaces").doc(workspaceId).update({
          plan,
          stripeCustomerId: checkout.customer,
          stripeSubscriptionId: subId,
        });
        log.info(`workspace ${workspaceId} upgraded to ${plan}`);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const workspaceId = sub.metadata?.workspaceId;
    if (workspaceId && adminDb) {
      await adminDb.collection("workspaces").doc(workspaceId).update({
        plan: "free",
      });
      log.info(`workspace ${workspaceId} reverted to free`);
    }
  }

  return NextResponse.json({ received: true });
}
