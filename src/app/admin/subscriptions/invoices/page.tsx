import React, { Suspense } from "react";
import { getInvoicesData } from "@/app/admin/actions";
import { InvoicesClient } from "./_components/InvoicesClient";

async function Fetcher() {
  const invoices = await getInvoicesData();
  return <InvoicesClient invoices={invoices} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-xs text-gray-500">All Stripe invoices with links to hosted PDFs.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
