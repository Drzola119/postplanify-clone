import React, { Suspense } from "react";
import { getPostsData } from "@/app/admin/actions";
import { PostsTableClient } from "../_components/PostsTableClient";

async function FailedPostsFetcher() {
  const posts = await getPostsData();
  const failed = posts.filter((p) => p.status === "failed");
  return <PostsTableClient initialPosts={failed} onlyFailed />;
}

export default function FailedPostsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <FailedPostsFetcher />
      </Suspense>
    </div>
  );
}
