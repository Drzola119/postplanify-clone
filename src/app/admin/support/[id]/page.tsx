import React, { Suspense } from "react";
import { getSupportTicketDetail } from "@/app/admin/actions";
import { SupportTicketDetailClient } from "../_components/SupportTicketDetailClient";

async function Fetcher({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getSupportTicketDetail(id);
  return <SupportTicketDetailClient ticket={ticket} ticketId={id} />;
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher {...props} />
      </Suspense>
    </div>
  );
}
