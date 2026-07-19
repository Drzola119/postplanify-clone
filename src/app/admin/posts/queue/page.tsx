import React, { Suspense } from "react";
import { getPostsData } from "@/app/admin/actions";
import { PostsTableClient } from "../_components/PostsTableClient";

async function ScheduledQueueFetcher() {
  const posts = await getPostsData();
  const scheduled = posts.filter((p) => p.status === "scheduled");
  return <PostsTableClient initialPosts={scheduled} />;
}

export default function ScheduledQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#01696f]">Scheduled Queue</h1>
        <p className="text-xs text-gray-500">Upcoming posts pending execution by the background publisher.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <ScheduledQueueFetcher />
      </Suspense>
    </div>
  );
}
