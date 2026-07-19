"use client";

import { useState, useEffect } from "react";
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
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform } from "@/lib/platforms";

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
  const t = useTranslations("dashboard");
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
            {isEdit ? t("brands.edit_title") : t("brands.create_title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? t("brands.edit_subtitle") : t("brands.create_subtitle")}
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
                      <p className="mt-1 text-xs text-muted-foreground">{t("brands.upload_logo")}</p>
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
                    {t("brands.name")}
                  </label>
                <input
                  id="ws-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("brands.name_placeholder")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                  <label className="text-sm font-medium leading-none" htmlFor="ws-domain">
                    {t("brands.domain")} <span className="text-muted-foreground">(optional)</span>
                  </label>
                <input
                  id="ws-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={t("brands.domain_placeholder")}
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
              <span className="text-sm font-medium">{t("brands.ai_settings")}</span>
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
                <span className="text-sm font-medium">{t("brands.knowledge_base")}</span>
                <span className="text-xs text-muted-foreground">(Optional)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                  ✨ {t("brands.premium_badge")}
                </span>
              </span>
              <span className="block text-xs text-muted-foreground mt-1 ml-6">
                {t("brands.knowledge_base_hint")}
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
            {t("brands.cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {busy ? t("brands.saving") : isEdit ? (
              <>
                <Save className="w-4 h-4" /> {t("brands.save_changes")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {t("brands.create_workspace_btn")}
              </>
            )}
          </button>
        </div>

        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={t("brands.close")}
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
  const t = useTranslations("dashboard");
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
          {t("brands.delete_title", { name: workspaceName })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("brands.delete_body")}
        </p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-2 sm:mt-0"
        >
          {t("brands.cancel")}
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
          {t("brands.delete_confirm")}
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={t("brands.close")}
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
  const t = useTranslations("dashboard");
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
        setError(data.error ?? t("brands.invite_failed"));
        return;
      }
      setEmail("");
      setShowInviteForm(false);
      setRole("Editor");
    } catch {
      setError(t("brands.invite_network_error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <DialogShell open={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
          {t("brands.team_title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("brands.team_subtitle", { name: workspace.name })}
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
              {t("brands.owner_badge")}
            </span>
          </div>
        </div>

        {/* Members section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("brands.team_count")}</h3>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {t("brands.seats_used", { used: 0, total: 3 })}
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
                {t("brands.invite_member")}
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
                  placeholder={t("brands.invite_placeholder")}
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Admin" | "Editor" | "Viewer")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Admin">{t("brands.role_admin")}</option>
                  <option value="Editor">{t("brands.role_editor")}</option>
                  <option value="Viewer">{t("brands.role_viewer")}</option>
                </select>
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={!validEmail || sending}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-9 px-3"
                >
                  {sending ? t("brands.invite_sending") : t("brands.invite_send")}
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
              <p className="text-sm font-medium">{t("brands.team_empty")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("brands.team_empty_sub")}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={t("brands.close")}
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
      { platform: "Bluesky", handle: "nicklorance.bsky.social", icon: <PlatformAvatar platform={getPlatform("bluesky")!} size={16} rounded="full" />, color: "text-black" },
      { platform: "Threads", handle: "nicklorance7", icon: <PlatformAvatar platform={getPlatform("threads")!} size={16} rounded="full" />, color: "text-black" },
      { platform: "Instagram", handle: "nicklorance7", icon: <PlatformAvatar platform={getPlatform("instagram")!} size={16} rounded="full" />, color: "text-red-500" },
      { platform: "TikTok", handle: "nick_lorance", icon: <PlatformAvatar platform={getPlatform("tiktok")!} size={16} rounded="full" />, color: "text-black" },
      { platform: "YouTube", handle: "Zakaria 11", icon: <PlatformAvatar platform={getPlatform("youtube")!} size={16} rounded="full" />, color: "text-red-500" },
      { platform: "Facebook", handle: "nick lorance life", icon: <PlatformAvatar platform={getPlatform("facebook")!} size={16} rounded="full" />, color: "text-blue-500" },
      { platform: "LinkedIn", handle: "Nick Lorance", icon: <PlatformAvatar platform={getPlatform("linkedin")!} size={16} rounded="full" />, color: "text-blue-500" },
      { platform: "X", handle: "LoranceNic36048", icon: <PlatformAvatar platform={getPlatform("twitter")!} size={16} rounded="full" />, color: "text-black" },
      { platform: "Pinterest", handle: "nicklorance7", icon: <PlatformAvatar platform={getPlatform("pinterest")!} size={16} rounded="full" />, color: "text-red-500" },
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
  const t = useTranslations("dashboard");
  const [workspaces, setWorkspaces] = useState<Workspace[]>(SEED_WORKSPACES);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const { toast } = useToast();

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
        toast({ tone: "error", title: "Failed to create workspace" });
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
      toast({ tone: "success", title: `Workspace "${data.name}" created` });
    } catch {
      toast({ tone: "error", title: "Network error creating workspace" });
    }
  };

  const handleSaveEdit = async (data: { name: string; domain: string }) => {
    if (!editing) return;
    if (editing.id !== activeWorkspaceId) {
      toast({ tone: "info", title: "Only the active workspace can be edited" });
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
        toast({ tone: "error", title: "Failed to update workspace" });
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
      toast({ tone: "success", title: `Workspace "${data.name}" updated` });
    } catch {
      toast({ tone: "error", title: "Network error updating workspace" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    if (deleting.id !== activeWorkspaceId) {
      toast({ tone: "info", title: "Only the active workspace can be deleted" });
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
      toast({ tone: "success", title: `Workspace "${name}" deleted` });
    } catch (err) {
      setDeleting(null);
      toast({ tone: "error", title: err instanceof Error ? err.message : `Workspace "${name}" deletion is not supported yet` });
    }
  };

  return (
    <div className="space-y-6">


      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <h2 className="text-[30px] font-bold leading-[36px] tracking-tight">{t("brands.page_title")}</h2>
            {(() => {
              const cfg = getHelpConfig("brands");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
            })()}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("brands.page_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t("brands.create_workspace")}
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-lg border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">{t("brands.col_workspace")}</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">{t("brands.col_domain")}</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">{t("brands.col_accounts")}</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[180px]">{t("brands.col_created")}</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[130px]">{t("brands.col_actions")}</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    {t("brands.loading")}
                  </td>
                </tr>
              ) : workspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    {t("brands.empty")}
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
                        {t("brands.invite_people")}
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