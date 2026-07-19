import React, { Suspense } from "react";
import { getUsersData } from "@/app/admin/actions";
import { UsersTableClient } from "./_components/UsersTableClient";

async function UsersDataFetcher() {
  const users = await getUsersData();
  return <UsersTableClient initialUsers={users} />;
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-xs text-gray-500">Manage user accounts, view profiles, change plans, or impersonate sessions.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <UsersDataFetcher />
      </Suspense>
    </div>
  );
}
