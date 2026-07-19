import React, { Suspense } from "react";
import { getDashboardOverviewData } from "./actions";
import { DashboardOverviewClient } from "./_components/DashboardOverviewClient";

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

async function DashboardOverviewDataFetcher() {
  const data = await getDashboardOverviewData();
  return <DashboardOverviewClient data={data} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <DashboardOverviewDataFetcher />
    </Suspense>
  );
}
