import React, { Suspense } from "react";
import { getApiLogs } from "@/app/admin/actions";
import { ApiLogsTableClient } from "./_components/ApiLogsTableClient";

async function LogsFetcher() {
  const logs = await getApiLogs();
  return <ApiLogsTableClient logs={logs} />;
}

export default function ApiLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Endpoint Logs</h1>
        <p className="text-xs text-gray-500">Live HTTP API execution logs and response time metrics.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <LogsFetcher />
      </Suspense>
    </div>
  );
}
