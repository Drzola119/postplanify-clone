import React, { Suspense } from "react";
import { getPlatformStatus } from "@/app/admin/actions";
import { PlatformStatusClient } from "./_components/PlatformStatusClient";

async function StatusFetcher() {
  const status = await getPlatformStatus();
  return <PlatformStatusClient initialStatus={status as { state: "operational" | "degraded" | "maintenance"; message: string }} />;
}

export default function AdminStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Status</h1>
        <p className="text-xs text-gray-500">Toggle the global platform status banner shown to all users.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <StatusFetcher />
      </Suspense>
    </div>
  );
}
