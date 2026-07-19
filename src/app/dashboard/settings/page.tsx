"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  EyeOff,
  Upload,
  Trash2,
  X,
  CreditCard,
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Info,
  User,
  Gem,
  Pencil,
  Cloud,
  Save,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { clientOverridesAllowed } from "@/lib/security/dev-only";
import {
  getOverrideHeaders,
  readDevOverrides,
  writeDevOverrides,
} from "@/lib/security/client-overrides";

/* ============================================================
   BRAND SVG COMPONENTS (extracted from live page)
   ============================================================ */

function CanvaLogo({ className }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/canva/00C4CC"
      alt="Canva"
      width={48}
      height={48}
      className={className}
      loading="lazy"
      decoding="async"
      style={{ width: 48, height: 48 }}
    />
  );
}

function GoogleDriveLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-label="Google Drive"
    >
      <path
        fill="#1e88e5"
        d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"
      />
      <path
        fill="#fbc02d"
        d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"
      />
      <path
        fill="#e53935"
        d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"
      />
      <path
        fill="#4caf50"
        d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"
      />
      <path
        fill="#1565c0"
        d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"
      />
      <path
        fill="#2e7d32"
        d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"
      />
    </svg>
  );
}


/* ============================================================
   CONFIRM MODAL
   ============================================================ */

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md mx-4 rounded-lg bg-white shadow-2xl p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {destructive && (
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="text-base font-semibold text-zinc-900">
              {title}
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium text-white transition-colors",
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CHANGE PASSWORD MODAL
   ============================================================ */

function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score], color: colors[score] };
}

function ChangePasswordModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { toast } = useToast();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <ChangePasswordModalBody onClose={onClose} onSubmit={onSubmit} />
  );
}

function ChangePasswordModalBody({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => passwordStrength(next), [next]);
  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !busy;

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ tone: "error", title: body.error ?? `Password change failed (${res.status})` });
        return;
      }
      onSubmit();
    } catch (err) {
      toast({ tone: "error", title: err instanceof Error ? err.message : "Network error changing password" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in-0"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-title"
        className="w-full max-w-md mx-4 rounded-lg bg-white shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 id="cp-title" className="text-lg font-semibold text-zinc-900">
            {t("settings.main.password_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-zinc-500">
            {t("settings.main.password_desc")}
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t("settings.main.password_current")}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder={t("settings.main.password_current_placeholder")}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label={showCurrent ? "Hide" : "Show"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">{t("settings.main.password_new")}</label>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder={t("settings.main.password_new_placeholder")}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label={showNext ? "Hide" : "Show"}
              >
                {showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {next.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i < strength.score ? strength.color : "bg-zinc-200"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  {tooShort
                    ? t("settings.main.password_hint")
                    : t(
                        [
                          "settings.main.password_too_weak",
                          "settings.main.password_weak",
                          "settings.main.password_fair",
                          "settings.main.password_good",
                          "settings.main.password_strong",
                        ][strength.score]
                      )}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t("settings.main.password_confirm")}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("settings.main.password_confirm_placeholder")}
                className={cn(
                  "h-9 w-full rounded-md border bg-white px-3 pr-9 text-sm focus:outline-none focus:ring-2",
                  mismatch
                    ? "border-red-300 focus:ring-red-500/10"
                    : "border-zinc-200 focus:ring-zinc-900/10"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mismatch && (
              <p className="text-xs text-red-600 mt-1">{t("settings.main.password_mismatch")}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t("settings.main.password_cancel")}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {busy ? t("settings.main.password_updating") : t("settings.main.password_update")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INTEGRATION ROW
   ============================================================ */

function IntegrationRow({
  logo,
  brand,
  description,
  integrationId,
  connected,
  onToggleConnect,
}: {
  logo: React.ReactNode;
  brand: string;
  description: string;
  integrationId: "canva" | "gdrive";
  connected: boolean;
  onToggleConnect: () => void;
}) {
  const t = useTranslations("dashboard");
  const helpKey = integrationId === "canva" ? "settings/canva" : "settings/google-drive";
  return (
    <div className="w-full md:w-1/2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{logo}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-sm font-semibold text-zinc-900">{brand}</h4>
            {(() => {
              const cfg = getHelpConfig(helpKey);
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-md" />;
            })()}
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-[440px]">{description}</p>
        </div>
      </div>

      <div className="mt-4">
        {connected ? (
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("settings.main.connected")}
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggleConnect}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            {integrationId === "canva" ? (
              <Pencil className="size-3.5" />
            ) : (
              <Cloud className="size-3.5" />
            )}
            {integrationId === "canva" ? t("settings.main.connect_canva") : t("settings.main.connect_gdrive")}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE PICTURE (square, teal, with always-visible trash)
   ============================================================ */

function ProfilePicture({
  src,
  initials,
  onUpload,
  onRemove,
}: {
  src: string | null;
  initials: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("dashboard");
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  return (
    <div className="md:w-[220px] flex-shrink-0">
      <p className="text-xs font-semibold text-zinc-700 mb-2">{t("settings.main.profile_picture")}</p>
      <div className="relative w-[220px] h-[220px]">
        <div
          className="relative w-full h-full rounded-md overflow-hidden flex items-center justify-center text-white font-bold cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => inputRef.current?.click()}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-7xl leading-none">{initials}</span>
          )}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5 transition-opacity",
              hover ? "opacity-100" : "opacity-0"
            )}
          >
            <Upload className="size-6 text-white" />
            <span className="text-xs font-medium text-white">{t("settings.main.upload_photo")}</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 size-8 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
          aria-label={t("settings.main.photo_remove")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

type TabId = "account" | "notifications" | "subscription";

export default function SettingsPage() {
  const t = useTranslations("dashboard");
  const [tab, setTab] = useState<TabId>("account");
  const { toast } = useToast();

  // Account state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [name, setName] = useState("Zack Wick");
  const [originalName] = useState("Zack Wick");
  const [email] = useState("zwick2264@gmail.com");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRemovePhoto, setShowRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // Integrations state — persisted to localStorage (same key as Accounts page)
  const INTEGRATIONS_LS_KEY = "postplanify.connectedIntegrations";
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [gdriveConnected, setGdriveConnected] = useState(false);

  // Integration overrides
  const [uploadPostKey, setUploadPostKey] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [bunnyZone, setBunnyZone] = useState("");
  const [bunnyPassword, setBunnyPassword] = useState("");
  const [originalOverrides, setOriginalOverrides] = useState({
    uploadPostKey: "",
    n8nWebhookUrl: "",
    bunnyZone: "",
    bunnyPassword: "",
  });

  // Load integration connection state from localStorage (shared with Accounts page)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(INTEGRATIONS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setCanvaConnected(parsed.includes("canva"));
        setGdriveConnected(parsed.includes("google-drive"));
      }
    } catch {}
  }, []);

  function persistIntegrations(next: Set<string>) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INTEGRATIONS_LS_KEY, JSON.stringify(Array.from(next)));
    }
  }

  // Load overrides from localStorage on mount. Only meaningful when
  // `clientOverridesAllowed()` returns true (dev/preview); in production
  // these inputs are display-only — they are never sent to the server.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readDevOverrides();
    const loaded = {
      uploadPostKey: stored.uploadPostKey ?? "",
      n8nWebhookUrl: stored.n8nWebhookUrl ?? "",
      bunnyZone: stored.bunnyZone ?? "",
      bunnyPassword: stored.bunnyPassword ?? "",
    };
    setUploadPostKey(loaded.uploadPostKey);
    setN8nWebhookUrl(loaded.n8nWebhookUrl);
    setBunnyZone(loaded.bunnyZone);
    setBunnyPassword(loaded.bunnyPassword);
    setOriginalOverrides(loaded);
  }, []);

  // Subscription state
  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch("/api/billing/portal", { method: "POST", body: "{}", signal: controller.signal })
      .then((res) => { if (!cancelled) setStripeConfigured(res.status !== 503); })
      .catch(() => { if (!cancelled) setStripeConfigured(false); })
      .finally(() => clearTimeout(timeout));
    return () => { cancelled = true; controller.abort(); };
  }, []);

  // Notifications state
  const [notif, setNotif] = useState({
    emailDigest: true,
    emailDigestFrequency: "weekly" as "daily" | "weekly" | "monthly",
    pushEnabled: false,
    postPublished: true,
    postFailed: true,
    inboxComment: true,
    inboxMessage: false,
    weeklyReport: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  const isDirty =
    name !== originalName ||
    profileFile !== null ||
    uploadPostKey !== originalOverrides.uploadPostKey ||
    n8nWebhookUrl !== originalOverrides.n8nWebhookUrl ||
    bunnyZone !== originalOverrides.bunnyZone ||
    bunnyPassword !== originalOverrides.bunnyPassword;

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name !== originalName) body.displayName = name;
      if (profileFile) {
        body.photoData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(profileFile!);
        });
      } else if (profileImage === null && profileFile === null) {
        body.photoURL = "";
      }

      if (Object.keys(body).length > 0) {
        const res = await fetch("/api/settings/profile", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast({ tone: "error", title: err.error?.message ?? "Failed to save profile" });
          return;
        }
        setProfileFile(null);
      }
    } catch (err) {
      toast({ tone: "error", title: err instanceof Error ? err.message : "Failed to save profile" });
      return;
    }

    // Save overrides to the dev storage key. In production these never
    // leave the browser (server-config silently ignores client override
    // headers), so the form below stays editable for visibility but acts
    // as no-op until client overrides are explicitly enabled.
    const overrides = { uploadPostKey, n8nWebhookUrl, bunnyZone, bunnyPassword };
    writeDevOverrides(overrides);
    setOriginalOverrides(overrides);

    setSaving(false);
    toast({ tone: "success", title: t("settings.main.toast_saved") });
  };

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setProfileImage(url);
    setProfileFile(file);
    toast({ tone: "info", title: t("settings.main.toast_photo_selected") });
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    setProfileFile(null);
    toast({ tone: "info", title: t("settings.main.toast_photo_removed") });
  };

  const handleCancelSubscription = () => {
    setAutoRenew(false);
    toast({ tone: "success", title: t("settings.main.toast_sub_cancelled", { date: "Jul 27, 2026" }) });
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notif),
      });
      if (!res.ok) {
        toast({ tone: "error", title: t("settings.main.toast_notif_save_error") });
      } else {
        toast({ tone: "success", title: t("settings.main.toast_notif_saved") });
      }
    } catch {
      toast({ tone: "error", title: t("settings.main.toast_notif_network_error") });
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("settings.main.page_title")}</h2>
        <p className="text-sm text-zinc-500">
          {t("settings.main.page_subtitle")}
        </p>
      </div>

      {/* Main */}
      <div className="space-y-4">
        {/* Tabs */}
        <div
          role="tablist"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "account"}
            onClick={() => setTab("account")}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
              tab === "account"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <User className="size-4" />
            {t("settings.main.tab_account")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "notifications"}
            onClick={() => setTab("notifications")}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
              tab === "notifications"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Bell className="size-4" />
            {t("settings.main.tab_notifications")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "subscription"}
            onClick={() => setTab("subscription")}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
              tab === "subscription"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Gem className="size-4" />
            {t("settings.main.tab_subscription")}
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {tab === "account" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              {/* Card header */}
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight text-zinc-900">
                  {t("settings.main.account_title")}
                </h3>
                <p className="text-sm text-zinc-500">
                  {t("settings.main.account_subtitle")}
                </p>
              </div>

              {/* Card body */}
              <div className="p-6 pt-0 space-y-6">
                {/* Profile row */}
                <div className="flex flex-col md:flex-row gap-6">
                  <ProfilePicture
                    src={profileImage}
                    initials="Z"
                    onUpload={handleUpload}
                    onRemove={() => setShowRemovePhoto(true)}
                  />
                  <div className="flex-1 space-y-4 min-w-0">
                    <Field
                      label={t("settings.main.full_name")}
                      value={name}
                      onChange={setName}
                      placeholder={t("settings.main.name_placeholder")}
                    />
                    <Field
                      label={t("settings.main.email")}
                      value={email}
                      onChange={() => undefined}
                      placeholder={t("settings.main.email_placeholder")}
                      disabled
                    />
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        {t("settings.main.security")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowChangePassword(true)}
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <ShieldCheck className="size-3.5" />
                        {t("settings.main.change_password")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="shrink-0 bg-zinc-200 h-[1px] w-full" />

                {/* Integrations (single row, two columns) */}
                <div className="flex flex-col md:flex-row gap-8">
                  <IntegrationRow
                    logo={<CanvaLogo className="w-12 h-12 flex-shrink-0" />}
                    brand={t("settings.main.canva_integration")}
                    description={t("settings.main.canva_desc")}
                    integrationId="canva"
                    connected={canvaConnected}
                    onToggleConnect={() => {
                      const next = new Set<string>();
                      const raw = typeof window !== "undefined" ? window.localStorage.getItem(INTEGRATIONS_LS_KEY) : null;
                      if (raw) { try { JSON.parse(raw).forEach((k: string) => next.add(k)); } catch {} }
                      if (canvaConnected) { next.delete("canva"); } else { next.add("canva"); }
                      persistIntegrations(next);
                      setCanvaConnected(!canvaConnected);
                      toast({ tone: "info", title: !canvaConnected ? t("settings.main.toast_canva_connected") : t("settings.main.toast_canva_disconnected") });
                    }}
                  />
                  <IntegrationRow
                    logo={<GoogleDriveLogo className="w-12 h-12 flex-shrink-0" />}
                    brand={t("settings.main.gdrive_integration")}
                    description={t("settings.main.gdrive_desc")}
                    integrationId="gdrive"
                    connected={gdriveConnected}
                    onToggleConnect={() => {
                      const next = new Set<string>();
                      const raw = typeof window !== "undefined" ? window.localStorage.getItem(INTEGRATIONS_LS_KEY) : null;
                      if (raw) { try { JSON.parse(raw).forEach((k: string) => next.add(k)); } catch {} }
                      if (gdriveConnected) { next.delete("google-drive"); } else { next.add("google-drive"); }
                      persistIntegrations(next);
                      setGdriveConnected(!gdriveConnected);
                      toast({ tone: "info", title: !gdriveConnected ? t("settings.main.toast_gdrive_connected") : t("settings.main.toast_gdrive_disconnected") });
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="shrink-0 bg-zinc-200 h-[1px] w-full" />

                {/* API & VPS Integration Overrides */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">{t("settings.main.api_overrides")}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t("settings.main.api_overrides_hint")}
                    </p>
                  </div>
                  {!clientOverridesAllowed() && (
                    <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                      <ShieldCheck className="size-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{t("settings.main.api_overrides_prod")}</p>
                        <p className="mt-1 text-amber-800">
                          {t("settings.main.api_overrides_warning")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label={t("settings.main.upload_post_key")}
                      value={uploadPostKey}
                      onChange={setUploadPostKey}
                      placeholder={t("settings.main.upload_post_placeholder")}
                      hint={t("settings.main.upload_post_hint")}
                      secret
                    />
                    <Field
                      label={t("settings.main.n8n_webhook")}
                      value={n8nWebhookUrl}
                      onChange={setN8nWebhookUrl}
                      placeholder={t("settings.main.n8n_placeholder")}
                      hint={t("settings.main.n8n_hint")}
                    />
                    <Field
                      label={t("settings.main.bunny_zone")}
                      value={bunnyZone}
                      onChange={setBunnyZone}
                      placeholder={t("settings.main.bunny_zone_placeholder")}
                      hint={t("settings.main.bunny_zone_hint")}
                    />
                    <Field
                      label={t("settings.main.bunny_password")}
                      value={bunnyPassword}
                      onChange={setBunnyPassword}
                      placeholder={t("settings.main.bunny_password_placeholder")}
                      hint={t("settings.main.bunny_password_hint")}
                      secret
                    />
                  </div>
                </div>

                {/* Save Changes (left-aligned, with floppy icon) */}
                <div className="flex items-center pt-2">
                  <button
                    type="button"
                    disabled={!isDirty || saving}
                    onClick={handleSave}
                    className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    {saving ? t("settings.main.saving") : t("settings.main.save_changes")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight text-zinc-900">
                  {t("settings.main.notif_title")}
                </h3>
                <p className="text-sm text-zinc-500">
                  {t("settings.main.notif_subtitle")}
                </p>
              </div>
              <div className="p-6 pt-0 space-y-5">
                <ToggleRow
                  label={t("settings.main.notif_email_digest")}
                  description={t("settings.main.notif_email_desc")}
                  checked={notif.emailDigest}
                  onChange={(v) => setNotif((n) => ({ ...n, emailDigest: v }))}
                />
                <div className="ml-7 pl-3 border-l border-zinc-200 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">{t("settings.main.notif_digest_freq")}</label>
                  <select
                    value={notif.emailDigestFrequency}
                    onChange={(e) =>
                      setNotif((n) => ({
                        ...n,
                        emailDigestFrequency: e.target.value as "daily" | "weekly" | "monthly",
                      }))
                    }
                    className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="daily">{t("settings.main.notif_daily")}</option>
                    <option value="weekly">{t("settings.main.notif_weekly")}</option>
                    <option value="monthly">{t("settings.main.notif_monthly")}</option>
                  </select>
                </div>
                <ToggleRow
                  label={t("settings.main.notif_browser_push")}
                  description={t("settings.main.notif_browser_desc")}
                  checked={notif.pushEnabled}
                  onChange={(v) => setNotif((n) => ({ ...n, pushEnabled: v }))}
                />
                <div className="border-t border-zinc-200 pt-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("settings.main.notif_activity")}
                  </p>
                  <ToggleRow
                    label={t("settings.main.notif_post_published")}
                    description={t("settings.main.notif_post_published_desc")}
                    checked={notif.postPublished}
                    onChange={(v) => setNotif((n) => ({ ...n, postPublished: v }))}
                  />
                  <ToggleRow
                    label={t("settings.main.notif_post_failed")}
                    description={t("settings.main.notif_post_failed_desc")}
                    checked={notif.postFailed}
                    onChange={(v) => setNotif((n) => ({ ...n, postFailed: v }))}
                  />
                  <ToggleRow
                    label={t("settings.main.notif_new_comment")}
                    description={t("settings.main.notif_new_comment_desc")}
                    checked={notif.inboxComment}
                    onChange={(v) => setNotif((n) => ({ ...n, inboxComment: v }))}
                  />
                  <ToggleRow
                    label={t("settings.main.notif_new_dm")}
                    description={t("settings.main.notif_new_dm_desc")}
                    checked={notif.inboxMessage}
                    onChange={(v) => setNotif((n) => ({ ...n, inboxMessage: v }))}
                  />
                  <ToggleRow
                    label={t("settings.main.notif_weekly_report")}
                    description={t("settings.main.notif_weekly_report_desc")}
                    checked={notif.weeklyReport}
                    onChange={(v) => setNotif((n) => ({ ...n, weeklyReport: v }))}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end bg-zinc-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={savingNotif}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingNotif ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("settings.main.notif_saving")}
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      {t("settings.main.notif_save")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {tab === "subscription" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight text-zinc-900">
                  {t("settings.main.sub_title")}
                </h3>
                <p className="text-sm text-zinc-500">
                  {t("settings.main.sub_subtitle")}
                </p>
              </div>

              <div className="p-6 pt-0 space-y-4">
                {stripeConfigured === false && (
                  <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <Info className="size-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t("settings.main.sub_not_configured")}</p>
                      <p className="mt-1 text-amber-800">{t("settings.main.sub_missing_env")}</p>
                    </div>
                  </div>
                )}
                {/* Single combined card with all info */}
                <div className="rounded-lg border border-zinc-200 bg-white">
                  {/* Plan + auto-renew */}
                  <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-zinc-900">
                        {t("settings.main.sub_price")}
                        <span className="text-sm font-medium text-zinc-500">{t("settings.main.sub_monthly")}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoRenew}
                      onClick={() => setAutoRenew((v) => !v)}
                      className="inline-flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          autoRenew ? "bg-zinc-900" : "bg-zinc-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform mt-px",
                            autoRenew ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </span>
                      <span className="text-sm text-zinc-700">{t("settings.main.sub_auto_renew")}</span>
                    </button>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Current period */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm text-zinc-700">{t("settings.main.sub_current_period")}</p>
                    <p className="text-sm text-zinc-700">{t("settings.main.sub_na")}</p>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Manage */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm font-semibold text-zinc-900">{t("settings.main.sub_manage")}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
                    >
                      <CreditCard className="size-3.5" />
                      {t("settings.main.sub_portal")}
                    </button>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Cancel */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm font-medium text-red-600">{t("settings.main.sub_cancel")}</p>
                    <button
                      type="button"
                      onClick={() => setShowCancel(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      {t("settings.main.sub_cancel_btn")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={() => {
          setShowChangePassword(false);
        }}
      />

      <ConfirmModal
        open={showRemovePhoto}
        onClose={() => setShowRemovePhoto(false)}
        onConfirm={handleRemovePhoto}
        title={t("settings.main.photo_remove_title")}
        description={t("settings.main.photo_remove_body")}
        confirmText={t("settings.main.photo_remove")}
        cancelText={t("settings.main.photo_keep")}
        destructive
      />

      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelSubscription}
        title={t("settings.main.cancel_sub_title")}
        description={t("settings.main.cancel_sub_body")}
        confirmText={t("settings.main.cancel_sub_confirm")}
        cancelText={t("settings.main.cancel_sub_keep")}
        destructive
      />
    </div>
  );
}

/* ============================================================
   FIELD
   ============================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  /** When true, render as a masked password input with a show/hide toggle. */
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const inputType = secret ? (revealed ? "text" : "password") : "text";
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-9 w-full rounded-md border border-zinc-200 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
            secret && "pr-9",
            disabled
              ? "bg-zinc-50 text-zinc-500 cursor-not-allowed"
              : "bg-white text-zinc-900"
          )}
          autoComplete={secret ? "off" : undefined}
          spellCheck={secret ? false : undefined}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            aria-label={revealed ? "Hide value" : "Show value"}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {description ? (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
          checked ? "bg-zinc-900 border-zinc-900" : "bg-zinc-200 border-zinc-200"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}