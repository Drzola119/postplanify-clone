import React, { Suspense } from "react";
import { getUsersData } from "@/app/admin/actions";
import { UsersTableClient } from "../_components/UsersTableClient";

async function ImpersonationFetcher() {
  const allUsers = await getUsersData();
  return <UsersTableClient initialUsers={allUsers} />;
}

export default function UserImpersonationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Impersonation Tool</h1>
        <p className="text-xs text-gray-500">Select any active user to generate a custom token and view their dashboard as them.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <ImpersonationFetcher />
      </Suspense>
    </div>
  );
}
