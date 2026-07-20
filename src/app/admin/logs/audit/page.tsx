import React, { Suspense } from "react";
import { getAdminAuditLog } from "@/app/admin/actions";
import { AuditLogClient } from "./_components/AuditLogClient";

async function AuditLogFetcher() {
  const logs = await getAdminAuditLog();
  return <AuditLogClient initialLogs={logs} />;
}

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Activity Log</h1>
        <p className="text-xs text-gray-500">Audit trail of every admin action performed across the platform.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <AuditLogFetcher />
      </Suspense>
    </div>
  );
}
