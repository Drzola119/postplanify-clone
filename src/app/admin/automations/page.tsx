import React, { Suspense } from "react";
import { getAutomationsOversight } from "@/app/admin/actions";
import { AutomationsClient } from "./_components/AutomationsClient";

async function Fetcher() {
  const automations = await getAutomationsOversight();
  return <AutomationsClient automations={automations} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automations Oversight</h1>
        <p className="text-xs text-gray-500">Cross-workspace view of active DM auto-responder campaigns and their volume.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
