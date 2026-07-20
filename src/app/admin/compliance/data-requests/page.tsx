import React, { Suspense } from "react";
import { getDataRequests } from "@/app/admin/actions";
import { DataRequestsClient } from "./_components/DataRequestsClient";

async function Fetcher() {
  const requests = await getDataRequests();
  return <DataRequestsClient requests={requests} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Requests</h1>
        <p className="text-xs text-gray-500">GDPR/CCPA export &amp; deletion requests. Deletions are destructive and fully audited.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
