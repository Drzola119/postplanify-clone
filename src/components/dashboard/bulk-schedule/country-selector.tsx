"use client";

import * as React from "react";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CountryConfig, listSupportedCountries } from "@/data/scheduling/countries";

interface CountrySelectorProps {
  selectedCountry: CountryConfig;
  onSelectCountry: (country: CountryConfig) => void;
  className?: string;
}

export function CountrySelector({
  selectedCountry,
  onSelectCountry,
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const supported = React.useMemo(() => listSupportedCountries(), []);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
      >
        <span className="text-sm leading-none">{selectedCountry.flagEmoji}</span>
        <span className="font-semibold text-zinc-900">{selectedCountry.name}</span>
        <ChevronDown className="size-3.5 text-zinc-500" />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full mt-1.5 z-40 w-[240px] rounded-xl border border-zinc-200 bg-white shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            Select Country
          </div>
          {supported.map((country) => (
            <li key={country.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectCountry(country);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-2 text-xs rounded-lg font-medium flex items-center justify-between transition-colors cursor-pointer",
                  country.id === selectedCountry.id
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100 text-zinc-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{country.flagEmoji}</span>
                  <span>{country.name}</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase font-mono px-1.5 py-0.5 rounded",
                    country.id === selectedCountry.id
                      ? "bg-zinc-800 text-zinc-200"
                      : "bg-zinc-100 text-zinc-700"
                  )}
                >
                  {country.timezone.split("/")[1]?.replace(/_/g, " ")}
                </span>
              </button>
            </li>
          ))}

          <li className="mt-1 pt-1 border-t border-zinc-100 px-2.5 py-1.5 text-[11px] text-zinc-600 italic flex items-center gap-1.5">
            <Globe className="size-3 text-zinc-500 shrink-0" />
            <span>More countries coming soon</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
