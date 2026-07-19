import React, { Suspense } from "react";
import { getPostsData } from "@/app/admin/actions";
import { PostsTableClient } from "./_components/PostsTableClient";

async function PostsFetcher() {
  const posts = await getPostsData();
  return <PostsTableClient posts={posts} />;
}

export default function AdminPostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Posts Moderation</h1>
        <p className="text-xs text-gray-500">Monitor content across all user accounts and social platforms.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <PostsFetcher />
      </Suspense>
    </div>
  );
}
