import React, { Suspense } from "react";
import { getIntegrationsAiUsage } from "@/app/admin/actions";
import { AiUsageClient } from "./_components/AiUsageClient";

async function Fetcher() {
  const data = await getIntegrationsAiUsage();
  return <AiUsageClient data={data} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Usage & Cost</h1>
        <p className="text-xs text-gray-500">Monitor AI generation usage and spending across all workspaces.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
