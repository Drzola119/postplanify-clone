import React, { Suspense } from "react";
import { getSecurityEvents } from "@/app/admin/actions";
import { SecurityEventsClient } from "../_components/SecurityEventsClient";

async function EventsFetcher() {
  const events = await getSecurityEvents();
  return <SecurityEventsClient events={events} />;
}

export default function SecurityEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Audit Events</h1>
        <p className="text-xs text-gray-500">Audit trail of authentication attempts, admin actions, and suspicious activities.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <EventsFetcher />
      </Suspense>
    </div>
  );
}
