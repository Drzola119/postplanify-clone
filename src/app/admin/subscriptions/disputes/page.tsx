import React, { Suspense } from "react";
import { getDisputesData } from "@/app/admin/actions";
import { DisputesClient } from "./_components/DisputesClient";

async function Fetcher() {
  const disputes = await getDisputesData();
  return <DisputesClient disputes={disputes} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-xs text-gray-500">Stripe charge disputes, auto-synced from the billing webhook. Respond via the Stripe dashboard.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
