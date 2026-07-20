import React, { Suspense } from "react";
import { getWorkspacesOverview } from "@/app/admin/actions";
import { WorkspacesClient } from "./_components/WorkspacesClient";

async function Fetcher() {
  const workspaces = await getWorkspacesOverview();
  return <WorkspacesClient workspaces={workspaces} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Workspaces</h1>
        <p className="text-xs text-gray-500">Platform-wide view of every workspace, owner, plan, and suspension state.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
