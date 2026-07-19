import React, { Suspense } from "react";
import { getSubscriptionsData } from "@/app/admin/actions";
import { SubscriptionsTableClient } from "../_components/SubscriptionsTableClient";

async function ChurnedSubsFetcher() {
  const subs = await getSubscriptionsData();
  return <SubscriptionsTableClient initialSubs={subs} filterTab="canceled" />;
}

export default function ChurnedSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Churned & Cancelled Subscriptions</h1>
        <p className="text-xs text-gray-500">Track lost subscriptions and churn metrics.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <ChurnedSubsFetcher />
      </Suspense>
    </div>
  );
}
