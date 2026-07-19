"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Grid3x3,
  X,
  Loader2,
  ExternalLink,
  Trash2,
  XCircle,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

type Platform =
  | "bluesky"
  | "instagram"
  | "pinterest"
  | "threads"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "discord"
  | "telegram"
  | "reddit"
  | "google_business";

interface ConnectedAccount {
  id: string;
  profileUsername: string;
  platform: Platform;
  handle: string;
  displayName: string | null;
  img: string | null;
  reauthRequired: boolean;
}

interface ProfileMeta {
  username: string;
  redirectUrl: string | null;
  blocked: boolean;
}

interface ApiResponse {
  ok: boolean;
  accounts: ConnectedAccount[];
  profiles: ProfileMeta[];
  plan: string | null;
  limit: number | null;
}

/** Extract a human-readable error string from any error response shape. */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as Record<string, unknown>;
  // Common shapes we may receive:
  // 1. { error: "string" }                     — direct error message
  // 2. { error: { message: "string" } }        — wrapped (requireSession)
  // 3. { error: { status, message } }          — same wrapped shape
  if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
  if (obj.error && typeof obj.error === "object") {
    const nested = obj.error as Record<string, unknown>;
    if (typeof nested.message === "string" && nested.message.trim()) {
      return nested.message;
    }
  }
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
  return fallback;
}

/** Map known HTTP statuses to actionable hints for the user. */
function hintForStatus(status: number, msg: string): string {
  if (status === 401) {
    // Two distinct failure modes:
    //   1. Stale session cookie — fixed by logging out and back in.
    //   2. Server-side FIREBASE_PRIVATE_KEY is the placeholder / missing —
    //      every cookie verification fails. Re-login can't help; the host
    //      env must be fixed (see docs/hpanel-env-paste.md).
    return "Session can't be verified. Try logging out and back in first. If the error persists after a fresh login, the server's FIREBASE_PRIVATE_KEY is missing or invalid — run `python scripts/diagnose-hpanel.py` for a diagnosis.";
  }
  if (status === 500 && /not configured/i.test(msg)) {
    return "Server is missing a required secret. Set it on the host (see docs/hpanel-env-paste.md) and redeploy.";
  }
  if (status === 502) {
    return "Upstream service (upload-post.com) is unreachable. Try Refresh in a minute.";
  }
  if (status === 503) {
    return "Server-side auth is not configured. The operator needs to paste a real Firebase Admin SDK private key into the host environment (see docs/hpanel-env-paste.md).";
  }
  return msg;
}

const PLATFORM_META: Record<
  Platform,
  { label: string; badgeColor: string }
> = {
  bluesky: { label: "Bluesky", badgeColor: "text-sky-500" },
  instagram: { label: "Instagram", badgeColor: "text-pink-600" },
  pinterest: { label: "Pinterest", badgeColor: "text-rose-600" },
  threads: { label: "Threads", badgeColor: "text-zinc-900" },
  tiktok: { label: "TikTok", badgeColor: "text-zinc-900" },
  youtube: { label: "YouTube", badgeColor: "text-red-600" },
  facebook: { label: "Facebook", badgeColor: "text-blue-600" },
  linkedin: { label: "LinkedIn", badgeColor: "text-blue-700" },
  twitter: { label: "X / Twitter", badgeColor: "text-zinc-900" },
  discord: { label: "Discord", badgeColor: "text-indigo-500" },
  telegram: { label: "Telegram", badgeColor: "text-sky-500" },
  reddit: { label: "Reddit", badgeColor: "text-orange-500" },
  google_business: { label: "Google Business", badgeColor: "text-blue-600" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const name = PLATFORM_META[platform]?.label ?? platform;
  return (
    <PlatformAvatar
      platform={{ id: platform, name, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
      size={20}
      rounded="sm"
    />
  );
}

function PlatformIconLarge({ platform, className }: { platform: Platform; className?: string }) {
  const name = PLATFORM_META[platform]?.label ?? platform;
  return (
    <PlatformAvatar
      platform={{ id: platform, name, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
      size={className ? 16 : 24}
      rounded="sm"
    />
  );
}

const AVAILABLE_PLATFORMS: { name: string; platform: Platform; key: string }[] = [
  { name: "Facebook", platform: "facebook", key: "facebook" },
  { name: "Instagram", platform: "instagram", key: "instagram" },
  { name: "X / Twitter", platform: "twitter", key: "twitter" },
  { name: "YouTube", platform: "youtube", key: "youtube" },
  { name: "TikTok", platform: "tiktok", key: "tiktok" },
  { name: "LinkedIn", platform: "linkedin", key: "linkedin" },
  { name: "Threads", platform: "threads", key: "threads" },
  { name: "Pinterest", platform: "pinterest", key: "pinterest" },
  { name: "Bluesky", platform: "bluesky", key: "bluesky" },
  { name: "Discord", platform: "discord", key: "discord" },
  { name: "Telegram", platform: "telegram", key: "telegram" },
  { name: "Reddit", platform: "reddit", key: "reddit" },
  { name: "Google Business", platform: "google_business", key: "google_business" },
];

type IntegrationKey = "unsplash" | "google-drive" | "canva" | "dropbox";

interface IntegrationMeta {
  key: IntegrationKey;
  name: string;
  description: string;
  authUrl: string;
  brand: { color: string; bg: string };
  steps: string[];
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    key: "unsplash",
    name: "Unsplash",
    description: "Browse and import royalty-free photos directly into your posts.",
    authUrl: "https://unsplash.com/developers",
    brand: { color: "#000000", bg: "#FFFFFF" },
    steps: [
      "Create a free developer account at unsplash.com/developers.",
      "Register a new app to obtain an Access Key.",
      "Paste the Access Key into PostPlanify → Settings → Integrations → Unsplash.",
    ],
  },
  {
    key: "google-drive",
    name: "Google Drive",
    description: "Pick images, videos, and PDFs straight from your Drive folders.",
    authUrl: "https://console.cloud.google.com/apis/credentials",
    brand: { color: "#1A73E8", bg: "#E8F0FE" },
    steps: [
      "Open Google Cloud Console and create (or select) a project.",
      "Enable the Google Drive API and configure an OAuth consent screen.",
      "Create OAuth credentials and paste the Client ID + Secret into PostPlanify → Settings → Integrations → Google Drive.",
    ],
  },
  {
    key: "canva",
    name: "Canva",
    description: "Import your Canva designs and edit them in a click.",
    authUrl: "https://www.canva.com/developers/",
    brand: { color: "#00C4CC", bg: "#E5FAFA" },
    steps: [
      "Sign up for the Canva Developers program and create an integration.",
      "Add PostPlanify as an authorized redirect URI.",
      "Copy the Client ID and Secret into PostPlanify → Settings → Integrations → Canva.",
    ],
  },
  {
    key: "dropbox",
    name: "Dropbox",
    description: "Browse and import files from any Dropbox folder.",
    authUrl: "https://www.dropbox.com/developers/apps",
    brand: { color: "#0061FF", bg: "#E5EFFF" },
    steps: [
      "Go to the Dropbox App Console and create a scoped app (Full Dropbox).",
      "Set the OAuth 2 redirect URI to https://trustiify.agency/api/integrations/dropbox/callback.",
      "Paste the App key and secret into PostPlanify → Settings → Integrations → Dropbox.",
    ],
  },
];

const INTEGRATIONS_LS_KEY = "postplanify.connectedIntegrations";

function IntegrationIcon({ k, className }: { k: IntegrationKey; className?: string }) {
  const sz = className ?? "w-6 h-6";
  switch (k) {
    case "unsplash":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M28 6h12v12h-4V14h-8V6zM16 6H4v12h4v-4h8V6z" fill="#000" />
          <circle cx="24" cy="30" r="12" fill="#000" />
        </svg>
      );
    case "google-drive":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M15.6 7.4l-9 15.6 6.5 0 9-15.6z" fill="#0066DA" />
          <path d="M32.4 7.4l-9 15.6 6.5 0 9-15.6z" fill="#00AC47" />
          <path d="M9 27l6.5 11.3 6.5-11.3z" fill="#EA4335" />
          <path d="M22 27l6.5 11.3 6.5-11.3z" fill="#00832D" />
          <path d="M15.6 7.4L24 23l6.5-11.3z" fill="#008329" />
        </svg>
      );
    case "canva":
      return (
        <span
          className={`inline-flex items-center justify-center rounded-md font-bold text-white ${sz}`}
          style={{ backgroundColor: "#00C4CC", fontSize: "1rem" }}
        >
          C
        </span>
      );
    case "dropbox":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M14 6 L24 13 L34 6 L24 0 Z" fill="#0061FF" />
          <path d="M14 24 L24 31 L34 24 L24 18 Z" fill="#0061FF" />
          <path d="M0 16 L10 23 L20 16 L10 9 Z" fill="#0061FF" />
          <path d="M28 16 L38 9 L48 16 L38 23 Z" fill="#0061FF" />
          <path d="M0 34 L10 41 L20 34 L10 27 Z" fill="#0061FF" />
          <path d="M28 34 L38 27 L48 34 L38 41 Z" fill="#0061FF" />
          <path d="M14 42 L24 49 L34 42 L24 35 Z" fill="#0061FF" />
        </svg>
      );
  }
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activePopup, setActivePopup] = useState<Window | null>(null);

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "TRUSTIIFY_AUTH_COMPLETE") {
        showToast("Social account connected successfully!", "success");
        fetchAccounts();
        if (activePopup && !activePopup.closed) {
          try { activePopup.close(); } catch {}
        }
        setActivePopup(null);
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [activePopup]);

  useEffect(() => {
    if (!activePopup) return;
    const interval = setInterval(() => {
      if (activePopup.closed) {
        clearInterval(interval);
        setActivePopup(null);
        fetchAccounts();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activePopup]);

  // Integration connections (Unsplash / Drive / Canva / Dropbox).
  // Tracked locally so the UI can show "Connected" once credentials are added in Settings.
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<IntegrationKey>>(
    () => new Set<IntegrationKey>()
  );
  const [setupIntegration, setSetupIntegration] = useState<IntegrationKey | null>(null);

  // Load connection state from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(INTEGRATIONS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const valid = INTEGRATIONS.map((i) => i.key) as string[];
        setConnectedIntegrations(new Set(parsed.filter((k) => valid.includes(k)) as IntegrationKey[]));
      }
    } catch {
      // Ignore corruption — start with empty set.
    }
  }, []);

  function persistIntegrations(next: Set<IntegrationKey>) {
    setConnectedIntegrations(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INTEGRATIONS_LS_KEY, JSON.stringify(Array.from(next)));
    }
  }

  function markConnected(k: IntegrationKey) {
    const next = new Set(connectedIntegrations);
    next.add(k);
    persistIntegrations(next);
    showToast(`${INTEGRATIONS.find((i) => i.key === k)?.name ?? k} marked as connected.`, "success");
    setSetupIntegration(null);
  }

  function disconnect(k: IntegrationKey) {
    const next = new Set(connectedIntegrations);
    next.delete(k);
    persistIntegrations(next);
    showToast(`${INTEGRATIONS.find((i) => i.key === k)?.name ?? k} disconnected.`, "info");
  }

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchAccounts = async () => {
    setError(null);
    setErrorStatus(null);
    try {
      const res = await fetch("/api/social-accounts/list", {
        cache: "no-store",
        headers: getOverrideHeaders(),
      });
      const data = (await res.json()) as unknown;
      const dataObj = data as ApiResponse;
      if (!res.ok || !dataObj.ok) {
        const raw = extractErrorMessage(data, "Failed to load accounts");
        const friendly = hintForStatus(res.status, raw);
        setErrorStatus(res.status);
        throw new Error(friendly);
      }
      setAccounts(dataObj.accounts);
      setProfiles(dataObj.profiles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load accounts";
      setError(msg);
      setAccounts([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Detect ?connected=1 / ?error= in the URL — show a toast on first paint
  // after the user returns from the hosted connect page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      showToast("Accounts updated. Reloading connections...", "success");
      // Refresh the account list to pick up newly linked profiles.
      fetchAccounts();
      // Clean the URL so a refresh doesn't re-toast.
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    } else if (params.get("error")) {
      showToast(`Connection failed: ${params.get("error")}`, "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [connecting, setConnecting] = useState(false);

  const openConnectPage = async (platformKey?: string) => {
    if (connecting) return;
    setConnecting(true);
    try {
      const url = new URL("/api/social-accounts/connect-url", window.location.origin);
      if (platformKey) {
        let key = platformKey.toLowerCase();
        if (key.includes("google")) key = "google_business";
        else if (key === "youtube") key = "youtube";
        else if (key === "linkedin") key = "linkedin";
        else if (key === "facebook") key = "facebook";
        else if (key === "instagram") key = "instagram";
        else if (key === "tiktok") key = "tiktok";
        else if (key === "pinterest") key = "pinterest";
        else if (key === "threads") key = "threads";
        else if (key === "bluesky") key = "bluesky";
        else if (key === "x" || key === "twitter") key = "x";
        url.searchParams.set("platform", key);
      }

      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: getOverrideHeaders(),
      });
      const payload = (await res.json()) as unknown;
      const data = payload as { ok?: boolean; url?: string };
      if (!res.ok || !data.ok || !data.url) {
        const raw = extractErrorMessage(payload, "Failed to open connect page");
        const friendly = hintForStatus(res.status, raw);
        throw new Error(friendly);
      }
      const width = 600;
      const height = 700;
      const left = Math.round((window.screen.width / 2) - (width / 2));
      const top = Math.round((window.screen.height / 2) - (height / 2));

      const popup = window.open(
        data.url,
        `trustiify_connect_${platformKey ? platformKey.toLowerCase().replace(/\s+/g, "_") : "all"}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        showToast("Popup was blocked. Please allow popups for this site.", "error");
        return;
      }

      setActivePopup(popup);

      showToast(
        platformKey
          ? `Opening secure connection for ${platformKey}...`
          : "Opening secure connection...",
        "info"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open connect page";
      showToast(msg, "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    showToast("Refreshing accounts from upload-post.com...", "info");
    await fetchAccounts();
    setRefreshingAll(false);
    if (!error) {
      showToast("Accounts refreshed successfully", "success");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/social-accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getOverrideHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      // upload-post.com does not expose a per-platform disconnect endpoint
      // via this JWT, so the source-of-truth remove has to happen on the
      // hosted connect page. We still update local state for instant feedback.
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showToast(
        "Account removed from view. To revoke at source, open the connect page and unlink it.",
        "info"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove account";
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-3 lg:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">Social Accounts</h2>
              {(() => {
                const cfg = getHelpConfig("accounts");
                if (!cfg) return null;
                return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
              })()}
            </div>
            <p className="text-muted-foreground">
              Connect and manage your social media accounts
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshingAll || loading}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {refreshingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openConnectPage()}
            disabled={connecting}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
          >
            {connecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Connect accounts
          </button>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">
                Could not load accounts
                {errorStatus ? <span className="text-rose-500"> ({errorStatus})</span> : null}
              </p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              {errorStatus === 401 && (
                <p className="text-[11px] text-rose-600 mt-2">
                  Try <strong>logging out and logging back in</strong> first — this usually fixes a stale session cookie. If a fresh login still fails, the server&apos;s <code className="px-1 py-0.5 rounded bg-rose-100">FIREBASE_PRIVATE_KEY</code> env var is the placeholder text instead of a real PEM. Run <code className="px-1 py-0.5 rounded bg-rose-100">python scripts/diagnose-hpanel.py</code> — it will report <code className="px-1 py-0.5 rounded bg-rose-100">privateKeyLooksLikePlaceholder: true</code> if so, and the operator must paste the real key into the host&apos;s environment variables (see <code className="px-1 py-0.5 rounded bg-rose-100">docs/hpanel-env-paste.md</code>).
                </p>
              )}
              {errorStatus === 503 && (
                <p className="text-[11px] text-rose-600 mt-2">
                  The server-side Firebase Admin SDK is not configured. Paste the real <code className="px-1 py-0.5 rounded bg-rose-100">FIREBASE_PRIVATE_KEY</code> into the host environment, then redeploy. See <code className="px-1 py-0.5 rounded bg-rose-100">docs/hpanel-env-paste.md</code>.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefreshAll}
              className="text-xs font-medium text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Card 1: Connected Accounts */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">
              Connected Accounts
            </div>
            <div className="text-sm text-zinc-500">
              {profiles.length > 0
                ? `${accounts.length} account${accounts.length === 1 ? "" : "s"} across ${profiles.length} profile${profiles.length === 1 ? "" : "s"} on upload-post.com`
                : "Manage your connected social media accounts"}
            </div>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-sm text-zinc-500">
                <Loader2 className="size-5 animate-spin" />
                Loading connected accounts from upload-post.com...
              </div>
            ) : accounts.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Info className="size-6 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No accounts connected yet</p>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Use the &quot;Connect&quot; buttons below to link your social media accounts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {accounts.map((account) => (
                    <ConnectedAccountCard
                      key={account.id}
                      account={account}
                      isDeleting={deletingId === account.id}
                      onDelete={() => setConfirmDeleteId(account.id)}
                      onReconnect={() => openConnectPage(PLATFORM_META[account.platform].label)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Available Platforms */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="font-semibold leading-none tracking-tight">
                  Available Platforms
                </div>
                <div className="text-sm text-zinc-500">
                  Connect new social media accounts
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs">
                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                <span className="text-amber-800">
                  Connection works best on Chrome or Edge.
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {AVAILABLE_PLATFORMS.map((p) => (
                  <PlatformCard
                    key={p.key}
                    name={p.name}
                    platform={p.platform}
                    onConnect={() => openConnectPage(p.name)}
                    isComingSoon={false}
                  />
                ))}
              </div>
              <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 flex items-start gap-2">
                <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
                <p className="text-xs text-zinc-500">
                  We only request permissions to schedule posts. Passwords are never
                  stored. Disconnect anytime in settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Available Integrations (Unsplash / Drive / Canva / Dropbox) */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">
              Available Integrations
            </div>
            <div className="text-sm text-zinc-500">
              Connect cloud storage and design tools to import media directly into your posts.
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {INTEGRATIONS.map((it) => {
                const isConnected = connectedIntegrations.has(it.key);
                return (
                  <div
                    key={it.key}
                    className={`p-4 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                      isConnected ? "border-emerald-300" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <IntegrationIcon k={it.key} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900">{it.name}</span>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            Connected
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{it.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {isConnected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSetupIntegration(it.key)}
                              className="inline-flex items-center justify-center h-7 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => disconnect(it.key)}
                              className="inline-flex items-center justify-center h-7 px-3 rounded-md text-rose-600 hover:bg-rose-50 text-xs font-medium"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSetupIntegration(it.key)}
                            className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-zinc-100 border border-zinc-200 flex items-start gap-2">
              <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
              <p className="text-xs text-zinc-500">
                Integrations use your own provider credentials and are stored encrypted. They only get
                used to import media for your posts — never to send messages, post, or access private data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg min-w-[280px]"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : toast.type === "error" ? (
              <XCircle className="size-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="size-4 text-blue-600 shrink-0" />
            )}
            <span className="text-sm text-zinc-900">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          account={accounts.find((a) => a.id === confirmDeleteId)!}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Integration Setup Modal */}
      {setupIntegration && (
        <IntegrationSetupModal
          meta={INTEGRATIONS.find((i) => i.key === setupIntegration)!}
          isConnected={connectedIntegrations.has(setupIntegration)}
          onClose={() => setSetupIntegration(null)}
          onMarkConnected={() => markConnected(setupIntegration)}
          onDisconnect={() => disconnect(setupIntegration)}
        />
      )}
    </div>
  );
}

function ConnectedAccountCard({
  account,
  isDeleting,
  onDelete,
  onReconnect,
}: {
  account: ConnectedAccount;
  isDeleting: boolean;
  onDelete: () => void;
  onReconnect: () => void;
}) {
  return (
    <div className={`group flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors bg-white ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-11 h-11 shrink-0">
          {account.img ? (
            <img
              src={account.img}
              alt={account.handle}
              className="rounded-full w-11 h-11 object-cover bg-zinc-100"
            />
          ) : (
            <div className="rounded-full w-11 h-11 flex items-center justify-center text-sm font-semibold bg-zinc-200 text-zinc-700">
              {account.handle.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-200">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-zinc-900 truncate">
              {account.handle}
            </p>
            {account.reauthRequired ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                <AlertCircle className="size-3" />
                Re-auth required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="size-3" />
                Connected
              </span>
            )}
          </div>
          {account.displayName && account.displayName !== account.handle && (
            <p className="text-xs text-zinc-500 truncate">{account.displayName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {account.reauthRequired ? (
          <button
            type="button"
            onClick={onReconnect}
            title="Reconnect this account in a new tab"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 px-3 h-8 text-xs font-medium text-white"
          >
            <RefreshCw className="size-3.5" />
            Reconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onReconnect}
            title="Open connect page in a new tab"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium hover:bg-zinc-50"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Remove account from view"
          className="inline-flex items-center justify-center size-8 rounded-md bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function PlatformCard({
  name,
  platform,
  onConnect,
  isComingSoon,
}: {
  name: string;
  platform: Platform;
  onConnect: () => void;
  isComingSoon?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-zinc-200 bg-white flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div className="flex items-center gap-2">
        <PlatformIconLarge platform={platform} />
        <span className="text-sm font-medium text-zinc-900">{name}</span>
        {isComingSoon && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Coming Soon
          </span>
        )}
      </div>
      {isComingSoon ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center h-8 px-6 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-400 text-xs font-medium whitespace-nowrap min-w-[100px] cursor-not-allowed"
        >
          Unavailable
        </button>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center justify-center h-8 px-6 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium whitespace-nowrap min-w-[100px]"
        >
          Connect
          <ExternalLink className="size-3 ml-1.5" />
        </button>
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  account,
  onConfirm,
  onCancel,
}: {
  account: ConnectedAccount;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-white rounded-xl border border-zinc-200 p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Trash2 className="size-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Remove account?</h3>
            <p className="text-sm text-zinc-500 mt-1">
              This hides <span className="font-semibold text-zinc-900">{account.handle}</span>{" "}
              from this view. To fully revoke at source, disconnect it from your
              upload-post.com dashboard.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationSetupModal({
  meta,
  isConnected,
  onClose,
  onMarkConnected,
  onDisconnect,
}: {
  meta: IntegrationMeta;
  isConnected: boolean;
  onClose: () => void;
  onMarkConnected: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 border-b border-zinc-200">
          <div className="size-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.brand.bg }}>
            <IntegrationIcon k={meta.key} className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              {isConnected ? `Manage ${meta.name}` : `Connect ${meta.name}`}
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  Connected
                </span>
              ) : null}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">{meta.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Setup steps
            </p>
            <ol className="space-y-2">
              {meta.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span
                    className="size-5 shrink-0 inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: meta.brand.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <a
            href={meta.authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-medium w-full"
          >
            Open {meta.name} developer console
            <ExternalLink className="size-3.5" />
          </a>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <p>
              {isConnected
                ? "You can revoke access anytime from here or from your provider account."
                : "After adding credentials in Settings, come back and click below to enable importing."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-zinc-50 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium"
          >
            Close
          </button>
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkConnected}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
            >
              Mark as connected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}