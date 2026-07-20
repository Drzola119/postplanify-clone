import React, { Suspense } from "react";
import { getPlatformAlerts } from "@/app/admin/actions";
import { AlertsClient } from "./_components/AlertsClient";

async function AlertsFetcher() {
  const alerts = await getPlatformAlerts();
  return <AlertsClient initialAlerts={alerts} />;
}

export default function AdminAlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Active Alerts</h1>
        <p className="text-xs text-gray-500">Monitor platform health, acknowledge incidents, and resolve issues.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <AlertsFetcher />
      </Suspense>
    </div>
  );
}
