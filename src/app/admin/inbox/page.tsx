import React, { Suspense } from "react";
import { getInboxModeration } from "@/app/admin/actions";
import { InboxModerationClient } from "./_components/InboxModerationClient";

async function Fetcher() {
  const comments = await getInboxModeration();
  return <InboxModerationClient comments={comments} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inbox Moderation</h1>
        <p className="text-xs text-gray-500">Cross-workspace view of comments and conversations for moderation.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
