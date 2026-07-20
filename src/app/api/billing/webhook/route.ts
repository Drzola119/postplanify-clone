import { NextRequest, NextResponse } from "next/server";
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

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { getStripe, getPlanByPriceId } = await import("@/lib/stripe");
  const stripe = getStripe();

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

  // Phase 5 — surface Stripe disputes for admin review
  if (event.type.startsWith("charge.dispute.")) {
    const dispute = event.data.object as any;
    if (adminDb) {
      await adminDb
        .collection("stripeDisputes")
        .doc(dispute.id)
        .set(
          {
            disputeId: dispute.id,
            chargeId: dispute.charge,
            paymentIntentId: dispute.payment_intent,
            amount: (dispute.amount ?? 0) / 100,
            currency: dispute.currency,
            reason: dispute.reason,
            status: dispute.status,
            evidenceDueBy: dispute.evidence_details?.due_by
              ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
              : null,
            stripeDashboardUrl: `https://dashboard.stripe.com/disputes/${dispute.id}`,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      log.info(`dispute ${dispute.id} (${event.type}) recorded`);
    }
  }

  return NextResponse.json({ received: true });
}
