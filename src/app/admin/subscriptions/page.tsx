import React, { Suspense } from "react";
import { getSubscriptionsData } from "@/app/admin/actions";
import { SubscriptionsTableClient } from "./_components/SubscriptionsTableClient";

async function SubscriptionsFetcher() {
  const subs = await getSubscriptionsData();
  return <SubscriptionsTableClient initialSubs={subs} filterTab="all" />;
}

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions Overview</h1>
        <p className="text-xs text-gray-500">Monitor active, trialing, past due, and cancelled Stripe subscriptions.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <SubscriptionsFetcher />
      </Suspense>
    </div>
  );
}
