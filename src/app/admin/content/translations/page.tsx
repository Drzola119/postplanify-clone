import React, { Suspense } from "react";
import { getTranslationsOverview } from "@/app/admin/localization/actions";
import { TranslationsClient } from "./_components/TranslationsClient";

async function Fetcher() {
  const data = await getTranslationsOverview();
  return <TranslationsClient data={data} />;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
        <p className="text-xs text-gray-500">Browse and edit i18n message keys across locales. Changes write to messages/*.json.</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded-2xl" />}>
        <Fetcher />
      </Suspense>
    </div>
  );
}
