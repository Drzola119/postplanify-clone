import React, { Suspense } from "react";
import { getAnalyticsOverview, getSocialAnalytics } from "@/app/admin/actions/analytics";
import AnalyticsClient from "./_components/AnalyticsClient";

async function AnalyticsFetcher() {
  const [overview, social] = await Promise.all([
    getAnalyticsOverview(),
    getSocialAnalytics()
  ]);

  return (
    <AnalyticsClient 
      initialOverview={overview} 
      initialSocial={social} 
    />
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <AnalyticsFetcher />
      </Suspense>
    </div>
  );
}
