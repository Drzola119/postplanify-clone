import React, { Suspense } from "react";
import { getContentOverrides } from "@/app/admin/actions";
import { ContentTemplatesClient } from "./_components/ContentTemplatesClient";

async function Fetcher() {
  const overrides = await getContentOverrides("template");
  return <ContentTemplatesClient overrides={overrides} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates Gallery</h1>
        <p className="text-xs text-gray-500">Edit template copy and SEO metadata. Overrides merge on top of the static defaults.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
