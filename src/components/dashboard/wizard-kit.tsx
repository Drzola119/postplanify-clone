"use client";

/**
 * Shared wizard primitives used by every step-based tool in the dashboard
 * (Infographics, Video Studio, and any future step-flow). Extracted from
 * infographic-wizard.tsx so two features can't drift into two different
 * design languages.
 *
 * The literal class strings here are the platform's design system — copy
 * them verbatim, don't paraphrase. Any visual divergence between Infographics
 * and Video Studio (or any other wizard) should be fixed here, not in
 * each wizard.
 */

export function Panel({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="flex items-baseline gap-3 mb-4">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-semibold">
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p> : null}
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-zinc-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-semibold">
        {label}
      </span>
      <span className="text-xs text-zinc-800 font-mono truncate">{value}</span>
    </div>
  );
}
