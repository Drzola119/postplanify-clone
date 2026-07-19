"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Loader2, CheckCircle, X } from "lucide-react";

const DISMISS_KEY = "email_banner_dismissed";

export default function EmailVerificationBanner() {
  const { user, sendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (!mounted) return null;

  const isVerified = user?.emailVerified;
  const isGoogleUser = user?.providerData?.some((p) => p?.providerId === "google.com");

  if (isVerified || dismissed || isGoogleUser || !user) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch {
      // Silently handle — user can retry
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mx-4 mt-4">
      {sent ? (
        <CheckCircle className="size-5 shrink-0 text-emerald-500" />
      ) : (
        <Mail className="size-5 shrink-0 text-amber-600" />
      )}
      <div className="flex-1 min-w-0">
        {sent ? (
          <p className="font-medium">Verification email sent! Check your inbox.</p>
        ) : (
          <p>
            Your email is not verified.{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="inline font-medium underline underline-offset-2 hover:text-amber-800 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Resend verification email"}
            </button>
          </p>
        )}
      </div>
      {sending && <Loader2 className="size-4 shrink-0 animate-spin text-amber-600" />}
      {!sent && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-amber-500 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
