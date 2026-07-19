import React, { Suspense } from "react";
import { getPostsData } from "@/app/admin/actions";
import { PostsTableClient } from "../_components/PostsTableClient";

async function FailedPostsFetcher() {
  const posts = await getPostsData();
  const failed = posts.filter((p) => p.status === "failed");
  return <PostsTableClient posts={failed} />;
}

export default function FailedPostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Failed Posts</h1>
        <p className="text-sm text-gray-500 mt-1">Posts that could not be published — review errors and retry.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <FailedPostsFetcher />
      </Suspense>
    </div>
  );
}
