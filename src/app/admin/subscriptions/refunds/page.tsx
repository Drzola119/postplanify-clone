import React, { Suspense } from "react";
import { issueRefundAction } from "@/app/admin/actions";
import { RefundsClient } from "./_components/RefundsClient";

async function Fetcher() {
  return <RefundsClient />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
        <p className="text-xs text-gray-500">Issue Stripe refunds for a charge or payment intent. Every refund is audited.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
