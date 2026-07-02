"use client";

import { Link2, AlertTriangle } from "lucide-react";

interface QuoteTweetInputProps {
  value?: string;
  onChange?: (v: string) => void;
}

export function QuoteTweetInput({ value = "", onChange }: QuoteTweetInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Link2 className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Paste tweet URL to quote (optional)"
          className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
        />
      </div>
      <div className="flex items-start gap-1.5 text-xs text-amber-600">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
        <span>
          You can only quote tweets where you've been mentioned or are part of the
          conversation thread.
        </span>
      </div>
    </div>
  );
}
