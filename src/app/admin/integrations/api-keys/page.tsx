import React, { Suspense } from "react";
import { getIntegrationsApiKeys } from "@/app/admin/actions";
import { ApiKeysClient } from "./_components/ApiKeysClient";

async function Fetcher() {
  const keys = await getIntegrationsApiKeys();
  return <ApiKeysClient initialKeys={keys} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="text-xs text-gray-500">Cross-workspace view of all API keys and their status.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
