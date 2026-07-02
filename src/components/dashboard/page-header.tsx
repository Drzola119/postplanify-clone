"use client";

import { ChevronDown } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  cta,
  learn = false,
}: {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
  learn?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">{title}</h1>
          {learn && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium hover:bg-zinc-50"
            >
              <span aria-hidden>📚</span>
              Learn
              <ChevronDown className="size-3.5" />
            </button>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {cta}
    </div>
  );
}