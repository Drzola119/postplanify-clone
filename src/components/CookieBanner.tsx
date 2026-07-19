"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "cookie_consent";

type CookiePreference = "accepted" | "declined" | null;

export default function CookieBanner() {
  const [preference, setPreference] = useState<CookiePreference>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookiePreference;
    setPreference(stored);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setPreference("accepted");
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setPreference("declined");
  };

  if (!mounted || preference !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-zinc-600">
          This website uses cookies to improve your experience. By continuing to
          browse, you agree to our use of cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
