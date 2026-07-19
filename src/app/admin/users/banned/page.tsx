import React, { Suspense } from "react";
import { getUsersData } from "@/app/admin/actions";
import { UsersTableClient } from "../_components/UsersTableClient";

async function BannedUsersFetcher() {
  const allUsers = await getUsersData();
  const banned = allUsers.filter((u) => u.status === "suspended");
  return <UsersTableClient initialUsers={banned} />;
}

export default function BannedUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Banned & Suspended Users</h1>
        <p className="text-xs text-gray-500">View and unsuspend accounts that are currently blocked from access.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <BannedUsersFetcher />
      </Suspense>
    </div>
  );
}
