import React, { Suspense } from "react";
import { getSubscriptionsData } from "@/app/admin/actions";
import { SubscriptionsTableClient } from "../_components/SubscriptionsTableClient";

async function ActiveSubsFetcher() {
  const subs = await getSubscriptionsData();
  return <SubscriptionsTableClient initialSubs={subs} filterTab="active" />;
}

export default function ActiveSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#01696f]">Active Subscriptions</h1>
        <p className="text-xs text-gray-500">All currently active paying customers.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <ActiveSubsFetcher />
      </Suspense>
    </div>
  );
}
