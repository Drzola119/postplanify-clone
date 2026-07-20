import React, { Suspense } from "react";
import { getIntegrationsWebhooks } from "@/app/admin/actions";
import { WebhooksClient } from "./_components/WebhooksClient";

async function Fetcher() {
  const webhooks = await getIntegrationsWebhooks();
  return <WebhooksClient initialWebhooks={webhooks} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <p className="text-xs text-gray-500">Cross-workspace overview of webhook endpoints and delivery status.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
