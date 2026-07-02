"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronUp, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (auth.status === "loading") {
    return <div className="h-14 border-t border-zinc-200" />;
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return (
      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/login?next=/dashboard"
          className="flex items-center justify-center h-9 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const displayName = auth.user.displayName || auth.user.email?.split("@")[0] || "User";
  const email = auth.user.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const photoURL = auth.user.photoURL;

  async function handleSignOut() {
    await auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="border-t border-zinc-200 p-3 relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 w-full rounded-md hover:bg-zinc-50 transition-colors p-1 -m-1 text-left"
      >
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoURL}
            alt={displayName}
            className="size-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="size-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-[11px] text-zinc-500 truncate">{email}</p>
        </div>
        <ChevronUp
          className={`size-4 text-zinc-400 transition-transform ${open ? "rotate-0" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 z-50">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 h-9 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 h-9 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
