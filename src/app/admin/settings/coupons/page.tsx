import React, { Suspense } from "react";
import { getCoupons } from "@/app/admin/actions";
import { CouponsClient } from "./_components/CouponsClient";

async function Fetcher() {
  const coupons = await getCoupons();
  return <CouponsClient initialCoupons={coupons} />;
}

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coupons &amp; Promo Codes</h1>
        <p className="text-xs text-gray-500">Discount coupons synced directly with Stripe Billing.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
