import React, { Suspense } from "react";
import { getAlertRules } from "@/app/admin/actions";
import { AlertRulesClient } from "./_components/AlertRulesClient";

async function RulesFetcher() {
  const rules = await getAlertRules();
  return <AlertRulesClient initialRules={rules} />;
}

export default function AdminAlertRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alert Rules</h1>
        <p className="text-xs text-gray-500">Configure thresholds, severity, and notification channels for platform alerts.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <RulesFetcher />
      </Suspense>
    </div>
  );
}
