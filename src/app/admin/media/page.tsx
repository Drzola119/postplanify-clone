import React, { Suspense } from "react";
import { getMediaStorageOverview } from "@/app/admin/actions";
import { MediaStorageClient } from "./_components/MediaStorageClient";

async function Fetcher() {
  const data = await getMediaStorageOverview();
  return <MediaStorageClient data={data} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media &amp; Storage</h1>
        <p className="text-xs text-gray-500">Aggregated media storage usage across all workspaces, with orphaned-asset cleanup.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
