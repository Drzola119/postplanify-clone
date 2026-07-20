import React, { Suspense } from "react";
import { getSecurityInfoAction } from "@/app/admin/actions";
import { SecurityClient } from "./_components/SecurityClient";

async function SecurityFetcher() {
  const info = await getSecurityInfoAction();
  return <SecurityClient initialInfo={info} />;
}

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Sessions</h1>
        <p className="text-xs text-gray-500">Manage your admin security settings, active sessions, and IP access controls.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <SecurityFetcher />
      </Suspense>
    </div>
  );
}
