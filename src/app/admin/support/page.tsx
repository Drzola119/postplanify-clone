import React, { Suspense } from "react";
import { getSupportTickets } from "@/app/admin/actions";
import { SupportTicketsClient } from "./_components/SupportTicketsClient";

async function Fetcher() {
  const tickets = await getSupportTickets();
  return <SupportTicketsClient tickets={tickets} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-xs text-gray-500">Lightweight ticket inbox with reply threads and status controls.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
