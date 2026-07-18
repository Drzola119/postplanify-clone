"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-zinc-400">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 h-10 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
