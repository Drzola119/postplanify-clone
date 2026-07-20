import React, { Suspense } from "react";
import { getIntegrationsSocialAccounts } from "@/app/admin/actions";
import { SocialAccountsClient } from "./_components/SocialAccountsClient";

async function Fetcher() {
  const accounts = await getIntegrationsSocialAccounts();
  return <SocialAccountsClient initialAccounts={accounts} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Social Accounts</h1>
        <p className="text-xs text-gray-500">Cross-workspace view of all connected social media accounts.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
