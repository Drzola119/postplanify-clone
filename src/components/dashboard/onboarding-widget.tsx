"use client";

import { useState } from "react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStep = {
  label: string;
  completed: boolean;
  href?: string;
};

export function OnboardingWidget({
  steps,
  bookCallHref = "https://cal.com/hasancagli/postplanify-demo-call",
}: {
  steps: OnboardingStep[];
  bookCallHref?: string;
}) {
  const [open, setOpen] = useState(true);
  const completedCount = steps.filter((s) => s.completed).length;
  const total = steps.length;
  const progressPct = total === 0 ? 0 : (completedCount / total) * 100;
  const allDone = completedCount === total;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 h-11 hover:bg-zinc-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900">Getting Started</span>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 h-5 text-[11px] font-medium text-zinc-700">
            {completedCount}/{total}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-zinc-500 transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>

      {open ? (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ul className="space-y-2">
            {steps.map((step) => {
              if (step.completed) {
                return (
                  <li
                    key={step.label}
                    className="flex items-center gap-2 text-zinc-700"
                  >
                    <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-3" />
                    </span>
                    <span className="line-through text-zinc-500">{step.label}</span>
                  </li>
                );
              }
              return (
                <li key={step.label}>
                  <a
                    href={step.href ?? "#"}
                    className="flex items-center justify-between gap-2 rounded-md bg-zinc-900 text-white px-3 h-10 hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium">{step.label}</span>
                    <ArrowRight className="size-4" />
                  </a>
                </li>
              );
            })}
          </ul>

          {!allDone ? (
            <p className="pt-1 text-xs text-zinc-500 text-center">
              Need help?{" "}
              <a
                href={bookCallHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              >
                Book a free call
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}