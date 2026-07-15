"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Users,
  BookOpen,
  ChevronDown,
  X,
  Sparkles,
  BookText,
  Loader2,
  Check,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

/* ============================================================
   BRAND / SOCIAL ICONS (exact paths from live page)
   ============================================================ */

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -3.268 64 68.414"
      width="24"
      height="24"
      className={className}
      aria-label="Bluesky"
    >
      <path
        fill="currentColor"
        d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805zm36.254 0C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745z"
      />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Threads"
      viewBox="0 0 192 192"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path
        className="fill-current"
        d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="Instagram">
      <path
        fill="currentColor"
        d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
      />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" className={className} aria-label="TikTok">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="YouTube">
      <path
        fill="currentColor"
        d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="Facebook">
      <path
        fill="currentColor"
        d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z"
      />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="LinkedIn">
      <path
        fill="currentColor"
        d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="X">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-label="Pinterest">
      <path
        fill="currentColor"
        d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.75 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z"
      />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Edit">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"
      />
    </svg>
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Delete">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"
      />
    </svg>
  );
}

function DeleteForeverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Delete forever">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

function GroupsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Invite">
      <path
        fill="currentColor"
        d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91M4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29M20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3"
      />
    </svg>
  );
}

function CloudUploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Upload">
      <path
        fill="currentColor"
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96M14 13v4h-4v-4H7l5-5 5 5z"
      />
    </svg>
  );
}

function MenuBookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Learn">
      <path
        fill="currentColor"
        d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1m0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5z"
      />
      <path
        fill="currentColor"
        d="M17.5 10.5c.88 0 1.73.09 2.5.26V9.24c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99M13 12.49v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26V11.9c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.3-4.5.83m4.5 1.84c-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26v-1.52c-.79-.16-1.64-.24-2.5-.24"
      />
    </svg>
  );
}

/* ============================================================
   LEARN DROPDOWN (legacy helpers removed; replaced by PageHelp)
   ============================================================ */

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
   LEARN HELP (replaced by PageHelp component)
   ============================================================ */


function DialogShell({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
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
        aria-labelledby="dialog-title"
        className={cn(
          "w-full max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-[48%]",
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   CREATE / EDIT WORKSPACE MODAL
   ============================================================ */

function WorkspaceFormModal({
  open,
  onClose,
  workspace,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  workspace?: Workspace | null;
  onSave: (data: { name: string; domain: string }) => Promise<void>;
}) {
  if (!open) return null;
  return (
    <WorkspaceFormModalBody
      workspace={workspace ?? null}
      onClose={onClose}
      onSave={onSave}
      key={`${workspace?.id ?? "new"}-${open ? "1" : "0"}`}
    />
  );
}

function WorkspaceFormModalBody({
  workspace,
  onClose,
  onSave,
}: {
  workspace: Workspace | null;
  onClose: () => void;
  onSave: (data: { name: string; domain: string }) => Promise<void>;
}) {
  const [name, setName] = useState(workspace?.name ?? "");
  const [domain, setDomain] = useState(
    workspace?.domain && workspace.domain !== "Not set" ? workspace.domain : ""
  );
  const [logo, setLogo] = useState<string | null>(workspace?.logo ?? null);
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [kbOpen, setKbOpen] = useState(false);

  const isEdit = !!workspace;
  const canSave = name.trim().length > 0 && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    try {
      await onSave({ name: name.trim(), domain: domain.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell open={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <h2
            id="dialog-title"
            className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2"
          >
            {isEdit ? "Edit Workspace" : "Create New Workspace"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update your workspace's information" : "Connect your social accounts under this workspace later."}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            {/* Logo upload */}
            <div>
              <div className="w-[150px] h-[150px]">
                <label className="flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer overflow-hidden relative">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <CloudUploadIcon className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-1 text-xs text-muted-foreground">Upload Logo</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogo(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Name + Domain */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium leading-none" htmlFor="ws-name">
                  Name
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Brand"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium leading-none" htmlFor="ws-domain">
                  Domain <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="ws-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* AI Assistant Settings */}
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-md border px-4 py-3 hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-500" />
              <span className="text-sm font-medium">AI Assistant Settings</span>
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </span>
            <ChevronDown className={cn("size-4 transition-transform", aiOpen && "rotate-180")} />
          </button>

          {/* Knowledge Base */}
          <button
            type="button"
            onClick={() => setKbOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-md border px-4 py-3 hover:bg-accent transition-colors text-left"
          >
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <BookText className="size-4 text-blue-500" />
                <span className="text-sm font-medium">Knowledge Base</span>
                <span className="text-xs text-muted-foreground">(Optional)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                  ✨ PREMIUM
                </span>
              </span>
              <span className="block text-xs text-muted-foreground mt-1 ml-6">
                Extra context to help the AI write more accurate inbox replies.
              </span>
            </span>
            <ChevronDown className="size-4 transition-transform shrink-0 ml-2" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-2 sm:mt-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {busy ? "Saving…" : isEdit ? (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Create Workspace
              </>
            )}
          </button>
        </div>

        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    </DialogShell>
  );
}

/* ============================================================
   DELETE WORKSPACE CONFIRM MODAL
   ============================================================ */

function DeleteWorkspaceModal({
  open,
  onClose,
  onConfirm,
  workspaceName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName: string;
}) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <DialogShell open={open} onClose={onClose} maxWidth="sm:max-w-[425px]">
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2
          id="dialog-title"
          className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 text-destructive mb-4"
        >
          <DeleteForeverIcon className="w-5 h-5" />
          Delete {workspaceName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this brand? This action will remove all
          associated social media accounts and cannot be undone.
        </p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-2 sm:mt-0"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await new Promise((r) => setTimeout(r, 600));
            onConfirm();
          }}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 py-2 gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <DeleteForeverIcon className="w-4 h-4" />}
          Delete
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </DialogShell>
  );
}

/* ============================================================
   TEAM MEMBERS (INVITE PEOPLE) MODAL
   ============================================================ */

function InviteMemberModal({
  open,
  onClose,
  workspace,
}: {
  open: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}) {
  if (!open || !workspace) return null;
  return (
    <InviteMemberModalBody
      workspace={workspace}
      onClose={onClose}
      key={`${workspace.id}-${open ? "1" : "0"}`}
    />
  );
}

function InviteMemberModalBody({
  workspace,
  onClose,
}: {
  workspace: Workspace;
  onClose: () => void;
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Editor" | "Viewer">("Editor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendInvite = async () => {
    if (!validEmail || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: role.toLowerCase() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to send invite");
        return;
      }
      setEmail("");
      setShowInviteForm(false);
      setRole("Editor");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DialogShell open={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
          Team Members
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage team members and their roles for{" "}
          <span className="font-semibold">{workspace.name}</span>
        </p>
      </div>

      <div className="space-y-6 mt-4">
        {/* Owner row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                Z
              </div>
              <div>
                <p className="font-medium">Zack Wick</p>
                <p className="text-sm text-muted-foreground">zwick2264@gmail.com</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent text-primary-foreground bg-primary">
              OWNER
            </span>
          </div>
        </div>

        {/* Members section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Members (0)</h3>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                0/3 seats used
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs"
                aria-label="Refresh"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs"
              >
                <Users className="size-3.5" />
                Invite Member
              </button>
            </div>
          </div>

          {/* Invite form (collapsed by default) */}
          {showInviteForm && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Admin" | "Editor" | "Viewer")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={!validEmail || sending}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-9 px-3"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </button>
              </div>
              {error ? (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {!showInviteForm && (
            <div className="rounded-md border border-dashed py-10 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Invite team members to collaborate on this workspace
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </DialogShell>
  );
}

/* ============================================================
   SAVE ICON (re-imported here to avoid circular)
   ============================================================ */
function Save({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
    </svg>
  );
}

/* ============================================================
   TYPES + DATA
   ============================================================ */

type WorkspaceAccount = {
  platform: string;
  handle: string;
  icon: React.ReactNode;
  color: string;
};

type Workspace = {
  id: string;
  name: string;
  domain: string;
  logo: string | null;
  accounts: WorkspaceAccount[];
  created: string;
};

const SEED_WORKSPACES: Workspace[] = [
  {
    id: "seed-1",
    name: "zack",
    domain: "Not set",
    logo: null,
    accounts: [
      { platform: "Bluesky", handle: "nicklorance.bsky.social", icon: <BlueskyIcon className="w-4 h-4 text-black" />, color: "text-black" },
      { platform: "Threads", handle: "nicklorance7", icon: <ThreadsIcon className="w-4 h-4 text-black" />, color: "text-black" },
      { platform: "Instagram", handle: "nicklorance7", icon: <InstagramIcon className="w-4 h-4 text-red-500" />, color: "text-red-500" },
      { platform: "TikTok", handle: "nick_lorance", icon: <TikTokIcon className="w-4 h-4 text-black" />, color: "text-black" },
      { platform: "YouTube", handle: "Zakaria 11", icon: <YouTubeIcon className="w-4 h-4 text-red-500" />, color: "text-red-500" },
      { platform: "Facebook", handle: "nick lorance life", icon: <FacebookIcon className="w-4 h-4 text-blue-500" />, color: "text-blue-500" },
      { platform: "LinkedIn", handle: "Nick Lorance", icon: <LinkedInIcon className="w-4 h-4 text-blue-500" />, color: "text-blue-500" },
      { platform: "X", handle: "LoranceNic36048", icon: <XIcon className="w-4 h-4 text-black" />, color: "text-black" },
      { platform: "Pinterest", handle: "nicklorance7", icon: <PinterestIcon className="w-4 h-4 text-red-500" />, color: "text-red-500" },
    ],
    created: "5 days ago",
  },
];

interface ApiWorkspace {
  id: string;
  name: string;
  ownerUid: string;
  plan?: string;
}

/* ============================================================
   PAGE
   ============================================================ */

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SEED_WORKSPACES);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const [editing, setEditing] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState<Workspace | null>(null);
  const [invitingFor, setInvitingFor] = useState<Workspace | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspaces", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as { workspaces?: ApiWorkspace[] };
        if (cancelled) return;
        const fetched = (data.workspaces ?? []).map<Workspace>((w) => ({
          id: w.id,
          name: w.name,
          domain: "Not set",
          logo: null,
          accounts: [],
          created: "Recently",
        }));
        if (fetched.length > 0) setWorkspaces(fetched);
        if (fetched[0]) setActiveWorkspaceId(fetched[0].id);
      } catch {
        // offline / unauthenticated — keep seed
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = () => setCreating(true);
  const handleEdit = (w: Workspace) => setEditing(w);
  const handleDelete = (w: Workspace) => setDeleting(w);
  const handleInvite = (w: Workspace) => setInvitingFor(w);

  const handleSaveCreate = async (data: { name: string; domain: string }) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: data.name, plan: "free" }),
      });
      if (!res.ok) {
        push("error", "Failed to create workspace");
        return;
      }
      const payload = (await res.json()) as { id?: string };
      const id = payload.id ?? `local-${Date.now()}`;
      const newWs: Workspace = {
        id,
        name: data.name,
        domain: data.domain || "Not set",
        logo: null,
        accounts: [],
        created: "Just now",
      };
      setWorkspaces((prev) => [...prev, newWs]);
      setCreating(false);
      push("success", `Workspace "${data.name}" created`);
    } catch {
      push("error", "Network error creating workspace");
    }
  };

  const handleSaveEdit = async (data: { name: string; domain: string }) => {
    if (!editing) return;
    if (editing.id !== activeWorkspaceId) {
      push("info", "Only the active workspace can be edited");
      return;
    }
    try {
      const res = await fetch(`/api/workspaces/${editing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: data.name }),
      });
      if (!res.ok) {
        push("error", "Failed to update workspace");
        return;
      }
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === editing.id
            ? { ...w, name: data.name, domain: data.domain || "Not set" }
            : w
        )
      );
      setEditing(null);
      push("success", `Workspace "${data.name}" updated`);
    } catch {
      push("error", "Network error updating workspace");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    if (deleting.id !== activeWorkspaceId) {
      push("info", "Only the active workspace can be deleted");
      setDeleting(null);
      return;
    }
    const name = deleting.name;
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(deleting.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getOverrideHeaders() },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      setWorkspaces((prev) => prev.filter((w) => w.id !== deleting.id));
      setDeleting(null);
      push("success", `Workspace "${name}" deleted`);
    } catch (err) {
      setDeleting(null);
      push(
        "error",
        err instanceof Error ? err.message : `Workspace "${name}" deletion is not supported yet`
      );
    }
  };

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <h2 className="text-[30px] font-bold leading-[36px] tracking-tight">Workspaces</h2>
            {(() => {
              const cfg = getHelpConfig("brands");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
            })()}
          </div>
          <p className="text-sm text-muted-foreground">
            Create workspaces to group your social media accounts &amp; posts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-lg border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Workspace</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Domain</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Social Accounts</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[180px]">Created</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    Loading workspaces…
                  </td>
                </tr>
              ) : workspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    No workspaces yet. Create your first one to get started.
                  </td>
                </tr>
              ) : (
                workspaces.map((w) => (
                <tr
                  key={w.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {/* Workspace */}
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                        {w.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.logo} alt={w.name} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs font-bold text-zinc-500">/logo.png</span>
                        )}
                      </div>
                      <div className="font-medium hover:text-primary transition-colors">
                        {w.name}
                      </div>
                    </div>
                  </td>
                  {/* Domain */}
                  <td className="p-2 align-middle">
                    <span className="text-muted-foreground">{w.domain}</span>
                  </td>
                  {/* Social Accounts */}
                  <td className="p-2 align-middle">
                    <div className="flex flex-wrap gap-2">
                      {w.accounts.map((a, i) => (
                        <div
                          key={i}
                          className="rounded-full border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground flex items-center gap-1.5 px-2 py-2 hover:bg-secondary/80 transition-colors"
                        >
                          {a.icon}
                          <span>{a.handle}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  {/* Created */}
                  <td className="p-2 align-middle text-muted-foreground">{w.created}</td>
                  {/* Actions */}
                  <td className="p-2 align-middle">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(w)}
                          className="p-0.5 hover:bg-secondary rounded transition-colors"
                          aria-label={`Edit ${w.name}`}
                        >
                          <EditIcon className="text-blue-600 w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(w)}
                          className="p-0.5 hover:bg-secondary rounded transition-colors"
                          aria-label={`Delete ${w.name}`}
                        >
                          <DeleteIcon className="text-destructive w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInvite(w)}
                        className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm rounded-md h-6 px-2 text-[10px] gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        <GroupsIcon className="css-q7mezt" style={{ fontSize: 14 }} />
                        Invite People
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <WorkspaceFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSave={handleSaveCreate}
      />
      <WorkspaceFormModal
        open={!!editing}
        workspace={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
      <DeleteWorkspaceModal
        open={!!deleting}
        workspaceName={deleting?.name ?? ""}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
      <InviteMemberModal
        open={!!invitingFor}
        workspace={invitingFor}
        onClose={() => setInvitingFor(null)}
      />
    </div>
  );
}