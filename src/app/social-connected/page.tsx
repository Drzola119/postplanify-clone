"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SocialConnectedPage() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Notify the parent window (opener) that auth is complete
    if (window.opener) {
      try {
        window.opener.postMessage(
          { type: "TRUSTIIFY_AUTH_COMPLETE", timestamp: Date.now() },
          window.location.origin
        );
      } catch (e) {
        console.error("[SocialConnected] Failed to post message to opener:", e);
      }

      // Automatically close the popup window after 800ms
      const t = setTimeout(() => {
        window.close();
        setClosed(true);
      }, 800);
      return () => clearTimeout(t);
    } else {
      // If opened directly, redirect to the dashboard
      const t = setTimeout(() => {
        window.location.href = "/dashboard/accounts";
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white px-4">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Account Connected!
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          Your social media account has been successfully linked.
        </p>
        {closed ? (
          <p className="text-xs text-zinc-500">You can safely close this window now.</p>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Updating dashboard and closing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
