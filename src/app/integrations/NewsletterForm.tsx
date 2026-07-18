"use client";

import { useState, FormEvent } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterForm() {
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
      <div className="mt-3 flex items-center gap-2 text-emerald-300 text-sm">
        <CheckCircle2 className="size-4 shrink-0" /> Subscribed!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
        placeholder="you@example.com"
        className="w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-2 ring-transparent transition placeholder:text-gray-400 focus:ring-white/80 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900 disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="mx-auto size-4 animate-spin" />
        ) : (
          "Subscribe"
        )}
      </button>
      {status === "error" && errorMsg ? (
        <div className="flex items-center gap-1.5 text-red-300 text-xs">
          <AlertCircle className="size-3" /> {errorMsg}
        </div>
      ) : null}
    </form>
  );
}
