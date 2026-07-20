import React, { Suspense } from "react";
import { getContentOverrides } from "@/app/admin/actions";
import { ContentBlogClient } from "./_components/ContentBlogClient";

async function Fetcher() {
  const overrides = await getContentOverrides("blog");
  return <ContentBlogClient overrides={overrides} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blog &amp; Pages</h1>
        <p className="text-xs text-gray-500">Edit blog post copy and SEO metadata. Overrides merge on top of the static code defaults.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
