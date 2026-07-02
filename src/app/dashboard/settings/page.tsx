"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   BRAND SVG COMPONENTS (extracted from live page)
   ============================================================ */

function CanvaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 508 508"
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      className={className}
      aria-label="Canva"
    >
      <g transform="matrix(.26718 0 0 .26718 0 0)">
        <circle cx="950" cy="950" r="950" fill="#7d2ae7" />
        <circle cx="950" cy="950" r="950" fill="url(#canvaRad1)" />
        <circle cx="950" cy="950" r="950" fill="url(#canvaRad2)" />
        <circle cx="950" cy="950" r="950" fill="url(#canvaRad3)" />
        <circle cx="950" cy="950" r="950" fill="url(#canvaRad4)" />
      </g>
      <path
        d="M446.744 276.845c-.665 0-1.271.43-1.584 1.33-4.011 11.446-9.43 18.254-13.891 18.254-2.563 0-3.6-2.856-3.6-7.336 0-11.21 6.71-34.982 10.095-45.82.392-1.312.646-2.485.646-3.483 0-3.15-1.722-4.696-5.987-4.696-4.598 0-9.547 1.8-14.36 10.233-1.663-7.435-6.691-10.683-13.715-10.683-8.12 0-15.965 5.224-22.421 13.696-6.456 8.471-14.048 11.25-19.76 9.88 4.108-10.057 5.634-17.57 5.634-23.145 0-8.746-4.324-14.028-11.308-14.028-10.624 0-16.747 10.134-16.747 20.797 0 8.237 3.736 16.708 11.954 20.817-6.887 15.573-16.943 29.66-20.758 29.66-4.93 0-6.379-24.123-6.105-41.38.176-9.9.998-10.408.998-13.401 0-1.722-1.115-2.896-5.595-2.896-10.448 0-13.676 8.844-14.165 18.998a50.052 50.052 0 01-1.8 11.406c-4.363 15.573-13.363 27.39-19.232 27.39-2.72 0-3.463-2.72-3.463-6.28 0-11.21 6.28-25.219 6.28-37.173 0-8.784-3.854-14.34-11.112-14.34-8.55 0-19.858 10.173-30.56 29.229 3.521-14.595 4.97-28.721-5.459-28.721a14.115 14.115 0 00-6.476 1.683 3.689 3.689 0 00-2.113 3.56c.998 15.535-12.521 55.329-25.336 55.329-2.328 0-3.463-2.524-3.463-6.593 0-11.23 6.691-34.943 10.056-45.801.43-1.409.666-2.622.666-3.678 0-2.974-1.84-4.5-6.007-4.5-4.578 0-9.547 1.741-14.34 10.174-1.683-7.435-6.711-10.683-13.735-10.683-11.523 0-24.397 12.19-30.051 28.076-7.572 21.208-22.832 41.692-43.375 41.692-18.645 0-28.486-15.515-28.486-40.03 0-35.392 25.982-64.308 45.253-64.308 9.215 0 13.617 5.869 13.617 14.869 0 10.897-6.085 15.964-6.085 20.112 0 1.272 1.057 2.524 3.15 2.524 8.374 0 18.234-9.841 18.234-23.262 0-13.422-10.897-23.243-30.168-23.243-31.851 0-63.898 32.047-63.898 73.113 0 32.673 16.121 52.374 44 52.374 19.017 0 35.628-14.79 44.588-32.047 1.018 14.302 7.513 21.776 17.413 21.776 8.804 0 15.925-5.243 21.364-14.458 2.094 9.645 7.65 14.36 14.87 14.36 8.275 0 15.201-5.243 21.794-14.986-.097 7.65 1.644 14.85 8.276 14.85 3.13 0 6.867-.725 7.533-3.464 6.984-28.877 24.24-52.453 29.523-52.453 1.565 0 1.995 1.507 1.995 3.287 0 7.846-5.537 23.928-5.537 34.2 0 11.092 4.716 18.43 14.459 18.43 10.8 0 21.775-13.227 29.092-32.556 2.29 18.058 7.24 32.633 14.987 32.633 9.508 0 26.392-20.014 36.625-41.203 4.01.509 10.036.372 15.827-3.717-2.465 6.241-3.912 13.07-3.912 19.897 0 19.663 9.39 25.18 17.47 25.18 8.785 0 15.907-5.243 21.365-14.458 1.8 8.315 6.398 14.34 14.85 14.34 13.225 0 24.71-13.519 24.71-24.612 0-2.934-1.252-4.715-2.72-4.715zm-274.51 18.547c-5.342 0-7.435-5.38-7.435-13.401 0-13.93 9.528-37.193 19.604-37.193 4.402 0 6.065 5.185 6.065 11.524 0 14.145-9.059 39.07-18.235 39.07zm182.948-41.574c-3.189-3.796-4.343-8.961-4.343-13.559 0-5.673 2.074-10.467 4.558-10.467 2.485 0 3.248 2.446 3.248 5.85 0 5.693-2.035 14.008-3.463 18.176zm41.418 41.574c-5.34 0-7.434-6.182-7.434-13.401 0-13.441 9.528-37.193 19.682-37.193 4.402 0 5.967 5.146 5.967 11.524 0 14.145-8.902 39.07-18.215 39.07z"
        fill="#fff"
        fillRule="nonzero"
      />
      <defs>
        <radialGradient id="canvaRad1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(1469.491) rotate(-49.416 1.37 .302)">
          <stop offset="0" stopColor="#6420ff" />
          <stop offset="1" stopColor="#6420ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="canvaRad2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(54.703 42.717 594.194) scale(1657.122)">
          <stop offset="0" stopColor="#00c4cc" />
          <stop offset="1" stopColor="#00c4cc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="canvaRad3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1023 -1030 473.711 470.491 367 1684)">
          <stop offset="0" stopColor="#6420ff" />
          <stop offset="1" stopColor="#6420ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="canvaRad4" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(595.999 1372 -2298.41 998.431 777 256)">
          <stop offset="0" stopColor="#00c4cc" stopOpacity=".73" />
          <stop offset="0" stopColor="#00c4cc" />
          <stop offset="1" stopColor="#00c4cc" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
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
   TUTORIAL CONTENT for integration "Learn" menus
   ============================================================ */

type TutorialItem = { title: string; description: string };
type TutorialGroup = { label: string; items: TutorialItem[] };

const TUTORIAL_CONTENT: Record<string, TutorialGroup[]> = {
  canva: [
    {
      label: "Getting started",
      items: [
        {
          title: "Connect your Canva account",
          description:
            "Link PostPlanify with Canva to import designs directly into your posts without leaving the editor.",
        },
        {
          title: "Authenticate via OAuth",
          description:
            "Click Connect and grant PostPlanify permission to read your Canva folders and assets.",
        },
      ],
    },
    {
      label: "Importing designs",
      items: [
        {
          title: "Import a Canva design",
          description:
            "Open the post composer, click the Canva button in the media panel, and pick a design from your library.",
        },
        {
          title: "Resize to any platform",
          description:
            "Use Canva's Magic Resize to adapt your design to Instagram, Facebook, LinkedIn, X and more with one click.",
        },
      ],
    },
    {
      label: "Best practices",
      items: [
        {
          title: "Brand kits",
          description:
            "Set up a Canva Brand Kit so colors, fonts, and logos stay consistent across every exported design.",
        },
        {
          title: "Export quality",
          description:
            "Choose PNG for transparency, JPG for smaller files, or PDF for print-ready output.",
        },
      ],
    },
  ],
  gdrive: [
    {
      label: "Getting started",
      items: [
        {
          title: "Connect Google Drive",
          description:
            "Link your Google account to import files straight from Drive into PostPlanify posts.",
        },
        {
          title: "Permission scopes",
          description:
            "We request drive.file and drive.readonly scopes — we never modify your Drive data.",
        },
      ],
    },
    {
      label: "Importing files",
      items: [
        {
          title: "Import a Drive file",
          description:
            "From the post composer, click the Drive icon and pick any image, video, or document.",
        },
        {
          title: "Supported formats",
          description:
            "JPG, PNG, GIF, WEBP, MP4, MOV, PDF, DOCX, XLSX and most modern media formats.",
        },
      ],
    },
    {
      label: "Troubleshooting",
      items: [
        {
          title: "Token expired",
          description:
            "If uploads fail, disconnect and reconnect Google Drive to refresh your access token.",
        },
        {
          title: "Quota errors",
          description:
            "Ensure your Google account has enough storage; large files may exceed Drive quotas.",
        },
      ],
    },
  ],
};

/* ============================================================
   TOAST SYSTEM
   ============================================================ */

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-md border px-4 py-3 shadow-lg text-sm font-medium min-w-[280px] max-w-[420px] animate-in slide-in-from-right-5",
            t.type === "success" && "bg-white border-emerald-200 text-emerald-900",
            t.type === "error" && "bg-white border-red-200 text-red-900",
            t.type === "info" && "bg-white border-zinc-200 text-zinc-900"
          )}
        >
          {t.type === "success" && (
            <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="size-3 text-white" strokeWidth={3} />
            </div>
          )}
          {t.type === "error" && (
            <div className="size-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <X className="size-3 text-white" strokeWidth={3} />
            </div>
          )}
          {t.type === "info" && (
            <div className="size-5 rounded-full bg-zinc-500 flex items-center justify-center flex-shrink-0">
              <Info className="size-3 text-white" strokeWidth={3} />
            </div>
          )}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-zinc-400 hover:text-zinc-700 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
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
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    onSubmit();
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
            Change password
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
            Choose a new password. Use at least 8 characters with a mix of letters, numbers, and symbols.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Enter current password"
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
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Enter new password"
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
                  {tooShort ? "Use at least 8 characters" : strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
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
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LEARN DROPDOWN
   ============================================================ */

function LearnDropdown({
  integrationId,
  onClose,
}: {
  integrationId: "canva" | "gdrive";
  onClose: () => void;
}) {
  const groups = TUTORIAL_CONTENT[integrationId];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-20 top-full right-0 mt-1 w-[340px] rounded-lg border border-zinc-200 bg-white shadow-xl p-3 animate-in fade-in-0 slide-in-from-top-2"
      role="menu"
    >
      <div className="px-2 pb-2 mb-2 border-b border-zinc-100">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tutorials</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide px-2 mb-1">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  <p className="text-sm font-medium text-zinc-900">{it.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{it.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
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
  const [learnOpen, setLearnOpen] = useState(false);

  return (
    <div className="w-full md:w-1/2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{logo}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-sm font-semibold text-zinc-900">{brand}</h4>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLearnOpen((v) => !v)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                aria-expanded={learnOpen}
              >
                Learn
                <ChevronDown className={cn("size-3 transition-transform", learnOpen && "rotate-180")} />
              </button>
              {learnOpen && (
                <LearnDropdown
                  integrationId={integrationId}
                  onClose={() => setLearnOpen(false)}
                />
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-[440px]">{description}</p>
        </div>
      </div>

      <div className="mt-4">
        {connected ? (
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Connected
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
            Connect {integrationId === "canva" ? "Canva" : "Google Drive"}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  return (
    <div className="md:w-[220px] flex-shrink-0">
      <p className="text-xs font-semibold text-zinc-700 mb-2">Profile Picture</p>
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
            <span className="text-xs font-medium text-white">Upload photo</span>
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
          aria-label="Remove photo"
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

type TabId = "account" | "subscription";

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("account");
  const { toasts, push, dismiss } = useToasts();

  // Account state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [name, setName] = useState("Zack Wick");
  const [originalName] = useState("Zack Wick");
  const [email] = useState("zwick2264@gmail.com");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRemovePhoto, setShowRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // Integrations state
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [gdriveConnected, setGdriveConnected] = useState(false);

  // Subscription state
  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancel, setShowCancel] = useState(false);

  const isDirty = name !== originalName || profileFile !== null;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    push("success", "Account settings updated");
  };

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setProfileImage(url);
    setProfileFile(file);
    push("info", "Photo selected. Click Save to apply.");
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    setProfileFile(null);
    push("info", "Photo removed. Click Save to apply.");
  };

  const handleCancelSubscription = () => {
    setAutoRenew(false);
    push("success", "Subscription cancelled. Access ends on Jul 27, 2026.");
  };

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-zinc-500">
          Manage your account settings and preferences
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
            Account
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
            Subscription
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-2">
          {tab === "account" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              {/* Card header */}
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight text-zinc-900">
                  Account Information
                </h3>
                <p className="text-sm text-zinc-500">
                  Update your account information and profile settings
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
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      placeholder="Your full name"
                    />
                    <Field
                      label="Email"
                      value={email}
                      onChange={() => undefined}
                      placeholder="you@example.com"
                      disabled
                    />
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Security
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowChangePassword(true)}
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <ShieldCheck className="size-3.5" />
                        Change Password
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
                    brand="Canva Integration"
                    description="Connect your Canva account to import your designs directly in PostPlanify when you are creating a new post."
                    integrationId="canva"
                    connected={canvaConnected}
                    onToggleConnect={() => {
                      setCanvaConnected((v) => !v);
                      push(
                        "success",
                        !canvaConnected ? "Canva connected" : "Canva disconnected"
                      );
                    }}
                  />
                  <IntegrationRow
                    logo={<GoogleDriveLogo className="w-12 h-12 flex-shrink-0" />}
                    brand="Google Drive Integration"
                    description="Connect your Google Drive account to access and import files when you are creating a new post."
                    integrationId="gdrive"
                    connected={gdriveConnected}
                    onToggleConnect={() => {
                      setGdriveConnected((v) => !v);
                      push(
                        "success",
                        !gdriveConnected ? "Google Drive connected" : "Google Drive disconnected"
                      );
                    }}
                  />
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
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "subscription" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight text-zinc-900">
                  Subscription Plan
                </h3>
                <p className="text-sm text-zinc-500">
                  Manage your subscription and billing information
                </p>
              </div>

              <div className="p-6 pt-0 space-y-4">
                {/* Single combined card with all info */}
                <div className="rounded-lg border border-zinc-200 bg-white">
                  {/* Plan + auto-renew */}
                  <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-zinc-900">
                        $99.00
                        <span className="text-sm font-medium text-zinc-500">/monthly</span>
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
                      <span className="text-sm text-zinc-700">Auto-renew</span>
                    </button>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Current period */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm text-zinc-700">Current period</p>
                    <p className="text-sm text-zinc-700">22/06/2026 - 29/06/2026</p>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Manage */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm font-semibold text-zinc-900">Manage Your Subscription</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
                    >
                      <CreditCard className="size-3.5" />
                      Customer Portal
                    </button>
                  </div>

                  <div className="border-t border-zinc-200" />

                  {/* Cancel */}
                  <div className="flex items-center justify-between p-5">
                    <p className="text-sm font-medium text-red-600">Cancel Subscription</p>
                    <button
                      type="button"
                      onClick={() => setShowCancel(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Cancel
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
          push("success", "Password updated successfully");
        }}
      />

      <ConfirmModal
        open={showRemovePhoto}
        onClose={() => setShowRemovePhoto(false)}
        onConfirm={handleRemovePhoto}
        title="Remove profile photo?"
        description="This will permanently remove your profile photo. You can upload a new one anytime."
        confirmText="Remove"
        cancelText="Keep photo"
        destructive
      />

      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel subscription?"
        description="Your subscription will remain active until Jul 27, 2026. After that, your account will switch to the Free plan and you'll lose access to premium features."
        confirmText="Cancel subscription"
        cancelText="Keep subscription"
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-9 w-full rounded-md border border-zinc-200 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
          disabled
            ? "bg-zinc-50 text-zinc-500 cursor-not-allowed"
            : "bg-white text-zinc-900"
        )}
      />
      {hint && <p className="text-xs text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}