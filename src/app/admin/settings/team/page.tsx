import React, { Suspense } from "react";
import { getAdminUsers } from "@/app/admin/actions";
import { TeamClient } from "./_components/TeamClient";

async function TeamFetcher() {
  const admins = await getAdminUsers();
  return <TeamClient initialAdmins={admins} />;
}

export default function AdminTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Team</h1>
        <p className="text-xs text-gray-500">Manage administrator accounts, roles, and permissions across the platform.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <TeamFetcher />
      </Suspense>
    </div>
  );
}
