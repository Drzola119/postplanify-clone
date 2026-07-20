import React, { Suspense } from "react";
import { getContentOverrides } from "@/app/admin/actions";
import { ContentLegalClient } from "./_components/ContentLegalClient";

const LEGAL_DOCS = [
  { key: "legal.terms", label: "Terms of Service" },
  { key: "legal.privacy-policy", label: "Privacy Policy" },
  { key: "legal.gdpr", label: "GDPR" },
  { key: "legal.cookies", label: "Cookie Policy" },
  { key: "legal.social-media-terms", label: "Social Media Terms" },
];

async function Fetcher() {
  const overrides = await getContentOverrides("legal");
  return <ContentLegalClient overrides={overrides} legalDocs={LEGAL_DOCS} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Legal Documents</h1>
        <p className="text-xs text-gray-500">Manage copy and SEO metadata for static legal pages. Overrides merge on top of the hardcoded defaults.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
