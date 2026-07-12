"use client";

import { useState } from "react";
import { Link2, Palette, MousePointerClick, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { validateUsername, createBio } from "@/lib/link-in-bio/store";

const FEATURES = [
  {
    icon: Palette,
    color: "bg-violet-100 text-violet-700",
    title: "Custom Themes",
    desc: "8 themes + color overrides",
  },
  {
    icon: MousePointerClick,
    color: "bg-emerald-100 text-emerald-700",
    title: "Click Analytics",
    desc: "Track views & link clicks",
  },
  {
    icon: InfinityIcon,
    color: "bg-sky-100 text-sky-700",
    title: "Unlimited Links",
    desc: "Add as many as you need",
  },
];

type Props = {
  onCreated: (username: string) => void;
};

export function ClaimScreen({ onCreated }: Props) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(cleaned);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateUsername(username);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    createBio(result.username, "");
    onCreated(result.username);
  };

  const isValid = (() => {
    const r = validateUsername(username);
    return r.ok;
  })();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-violet-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Link in Bio</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Create a customizable landing page for your social media profiles
        </p>
      </div>

      {/* Claim card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-zinc-900 flex items-center justify-center">
            <Link2 className="size-6 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">Claim your link</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Choose a username for your bio page
          </p>

          <form onSubmit={handleSubmit} className="mt-6 w-full max-w-md">
            <label className="flex items-center w-full rounded-lg border border-zinc-200 bg-white overflow-hidden focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200">
              <span className="px-3 text-sm text-zinc-500 select-none border-r border-zinc-200 py-3 bg-zinc-50">
                postplanify.com/@
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="your-username"
                className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                aria-label="Username"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            {error && (
              <p className="mt-2 text-xs text-red-600 text-left">{error}</p>
            )}
            <button
              type="submit"
              disabled={!isValid}
              className="mt-4 w-full rounded-lg bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Bio Page
            </button>
          </form>
        </div>
      </div>

      {/* Features */}
      <div className="mt-6 space-y-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div
                className={`size-9 rounded-lg ${f.color} flex items-center justify-center shrink-0`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{f.title}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}