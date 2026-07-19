"use client";

import { useState, FormEvent } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function BlogNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
        <CheckCircle2 className="size-5 shrink-0" />
        <p className="text-sm font-medium">You&apos;re subscribed!</p>
      </div>
    );
  }

  return (
    <form className="mt-6 flex w-full flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} noValidate>
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          placeholder="email@example.com"
          aria-label="Email address"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-base text-gray-900 outline-none ring-2 ring-transparent transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-blue-200 disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Subscribe
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
      {status === "error" && errorMsg && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs col-span-full">
          <AlertCircle className="size-3" /> {errorMsg}
        </div>
      )}
    </form>
  );
}
