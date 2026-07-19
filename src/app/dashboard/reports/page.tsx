"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  FileText,
  Eye,
  Copy as CopyIcon,
  Download,
  Trash2,
  Palette,
  X,
  Check,
  CheckCircle2,
  Loader2,
  Info,
  Pencil,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getPlatform } from "@/lib/platforms";

type CompareMode = "none" | "previous_period" | "previous_year" | "week_over_week" | "custom_range";

interface Account {
  id: string;
  name: string;
  platform: string;
  color?: string;
}

interface Report {
  id: string;
  title: string;
  template: string;
  from: string;
  to: string;
  createdAt: string;
  accounts: number;
  status: "pending" | "ready" | "failed";
}

const REPORT_TEMPLATES: { value: string; labelKey: string }[] = [
  { value: "performance", labelKey: "template_performance" },
  { value: "engagement", labelKey: "template_engagement" },
  { value: "audience", labelKey: "template_audience" },
  { value: "competitor", labelKey: "template_competitor" },
  { value: "custom", labelKey: "template_custom" },
];

interface Schedule {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  active: boolean;
}

const SAMPLE_ACCOUNTS: Account[] = [
  { id: "a1", name: "Zakaria 11", platform: "youtube", color: "#FF0000" },
  { id: "a2", name: "nicklorance.bsky.social", platform: "bluesky", color: "#1185FE" },
  { id: "a3", name: "nicklorance7", platform: "threads", color: "#000000" },
  { id: "a4", name: "nicklorance7", platform: "instagram", color: "#E1306C" },
  { id: "a5", name: "nick_lorance", platform: "tiktok", color: "#000000" },
  { id: "a6", name: "nicklorance7", platform: "pinterest", color: "#E60023" },
  { id: "a7", name: "nick lorance life", platform: "facebook", color: "#1877F2" },
  { id: "a8", name: "Nick Lorance", platform: "linkedin", color: "#0A66C2" },
  { id: "a9", name: "LoranceNic36048", platform: "twitter", color: "#000000" },
];

const PLATFORM_ICONS: Record<string, ReactNode> = {
  youtube: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("youtube")!} />,
  bluesky: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("bluesky")!} />,
  threads: <PlatformAvatar size={14} rounded="full" platform={getPlatform("threads")!} />,
  instagram: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("instagram")!} />,
  tiktok: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("tiktok")!} />,
  pinterest: <PlatformAvatar size={14} rounded="full" platform={getPlatform("pinterest")!} />,
  facebook: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("facebook")!} />,
  linkedin: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("linkedin")!} />,
  twitter: <PlatformAvatar size={14} rounded="sm" platform={getPlatform("twitter")!} />,
};

const COMPARE_OPTIONS: { id: CompareMode; labelKey: string }[] = [
  { id: "none", labelKey: "compare_none" },
  { id: "previous_period", labelKey: "compare_previous" },
  { id: "previous_year", labelKey: "compare_same_last_year" },
  { id: "week_over_week", labelKey: "compare_wow" },
  { id: "custom_range", labelKey: "compare_custom" },
];

const SAMPLE_REPORTS: Report[] = [
  {
    id: "r1",
    title: "Performance Report",
    template: "performance",
    from: "May 24, 2026",
    to: "Jun 23, 2026",
    createdAt: "Jun 23, 2026",
    accounts: 9,
    status: "ready",
  },
];

const SAMPLE_SCHEDULES: Schedule[] = [];

function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function parseDate(s: string): Date {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function longDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return fmtDate(d);
}

function defaultTo(): string {
  return fmtDate(new Date());
}

type RangePreset = "7d" | "30d" | "90d" | "this_month" | "last_month";

function presetRange(preset: RangePreset): { from: string; to: string } {
  const today = new Date();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (preset === "this_month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmtDate(from), to: fmtDate(today) };
  }
  if (preset === "last_month") {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmtDate(from), to: fmtDate(to) };
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(endOfDay);
  from.setDate(from.getDate() - days + 1);
  return { from: fmtDate(from), to: fmtDate(today) };
}

const RANGE_PRESETS: { value: RangePreset; labelKey: string }[] = [
  { value: "7d", labelKey: "last_7_days" },
  { value: "30d", labelKey: "last_30_days" },
  { value: "90d", labelKey: "last_90_days" },
  { value: "this_month", labelKey: "this_month" },
  { value: "last_month", labelKey: "last_month" },
];

export default function ReportsPage() {
  const t = useTranslations("dashboard");
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<string>("performance");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [activePreset, setActivePreset] = useState<RangePreset | null>(null);
  const [compare, setCompare] = useState<CompareMode>("previous_period");
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set(SAMPLE_ACCOUNTS.map((a) => a.id)));

  const [compareOpen, setCompareOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);

  const [accentColor, setAccentColor] = useState("#2563eb");
  const [footerText, setFooterText] = useState("");

  const [generating, setGenerating] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>(SAMPLE_SCHEDULES);

  // New Schedule form state
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleFreq, setScheduleFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scheduleRecipients, setScheduleRecipients] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [creating, setCreating] = useState(false);

  const [reports, setReports] = useState<Report[]>(SAMPLE_REPORTS);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Hydrate reports + schedules from the live API on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [reportsRes, schedulesRes] = await Promise.all([
          fetch("/api/reports", { credentials: "include" }),
          fetch("/api/reports/schedules", { credentials: "include" }),
        ]);
        if (cancelled) return;
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          const items: Report[] = (data.reports ?? []).map(
            (r: { id: string; name: string; template: string; dateRange: { from: string; to: string }; createdAt: string; status: "pending" | "ready" | "failed" }) => ({
              id: r.id,
              title: r.name,
              template: r.template,
              from: r.dateRange.from.slice(0, 10),
              to: r.dateRange.to.slice(0, 10),
              createdAt: r.createdAt.slice(0, 10),
              accounts: 0,
              status: r.status,
            })
          );
          if (items.length) setReports(items);
        }
        if (schedulesRes.ok) {
          const data = await schedulesRes.json();
          const items: Schedule[] = (data.schedules ?? []).map(
            (s: { id: string; name: string; cron: string; recipients: string[]; paused: boolean }) => ({
              id: s.id,
              name: s.name,
              frequency: "weekly",
              time: "00:00",
              recipients: s.recipients,
              active: !s.paused,
            })
          );
          setSchedules(items);
        }
      } catch {
        /* keep SAMPLE_* as offline fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close dropdowns on Escape
  useEffect(() => {
    if (!compareOpen && !accountsOpen && !scheduledOpen && !newScheduleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCompareOpen(false);
        setAccountsOpen(false);
        setScheduledOpen(false);
        setNewScheduleOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [compareOpen, accountsOpen, scheduledOpen, newScheduleOpen]);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.size === SAMPLE_ACCOUNTS.length) setSelectedAccounts(new Set());
    else setSelectedAccounts(new Set(SAMPLE_ACCOUNTS.map((a) => a.id)));
  };

  const handleExportReports = () => {
    const csv = toCsv(reports.map((r) => ({
      id: r.id,
      title: r.title,
      from: r.from,
      to: r.to,
      createdAt: r.createdAt,
      accounts: r.accounts,
    })));
    downloadCsv(`reports-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const applyPreset = (preset: RangePreset) => {
    const range = presetRange(preset);
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset);
  };

  const handleExportSchedules = () => {
    const csv = toCsv(schedules.map((s) => ({
      id: s.id,
      name: s.name,
      frequency: s.frequency,
      dayOfWeek: s.dayOfWeek ?? "",
      dayOfMonth: s.dayOfMonth ?? "",
      time: s.time,
      recipients: s.recipients.join("|"),
      active: s.active,
    })));
    downloadCsv(`report-schedules-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    const reportTitle = title.trim() || "Performance Report";
    try {
      // Convert dd/mm/yyyy → yyyy-mm-dd for the API.
      const [fd, fm, fy] = from.split("/").map(Number);
      const [td, tm, ty] = to.split("/").map(Number);
      const res = await fetch("/api/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportTitle,
          template,
          dateRange: {
            from: new Date(fy, fm - 1, fd).toISOString(),
            to: new Date(ty, tm - 1, td).toISOString(),
          },
          format: "pdf",
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        showToast(t("reports.toast_create_error", { status: res.status, text: errText }), "error");
        return;
      }
      const { id } = (await res.json()) as { id: string };

      // Optimistically add to the list so the user sees feedback while the
      // download window opens. status="pending" until /download finishes.
      const newReport: Report = {
        id,
        title: reportTitle,
        template,
        from: longDate(parseDate(from)),
        to: longDate(parseDate(to)),
        createdAt: longDate(new Date()),
        accounts: selectedAccounts.size,
        status: "pending",
      };
      setReports((prev) => [newReport, ...prev]);

      // Open the download. Browser starts the request immediately; we don't
      // need to poll because the route is synchronous on-demand generation.
      const downloadUrl = `/api/reports/${id}/download`;
      if (typeof window !== "undefined") {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }

      // Mark ready after a short beat so the UI reflects the download started.
      setTimeout(() => {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "ready" } : r)));
      }, 2000);

      showToast(t("reports.toast_generated"));
    } catch (err) {
      showToast(
        `Network error: ${err instanceof Error ? err.message : "unknown"}`,
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = (id: string) => {
    if (typeof window !== "undefined") {
      window.open(`/api/reports/${id}/download`, "_blank", "noopener,noreferrer");
    }
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showToast(t("reports.toast_deleted"));
  };

  const copyLink = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://postplanify.com/reports/${id}`);
    }
    showToast(t("reports.toast_link_copied"));
  };

  const handleCreateSchedule = async () => {
    const name = scheduleName.trim();
    if (!name) { showToast(t("reports.toast_name_required"), "error"); return; }
    const recipients = scheduleRecipients.split(",").map((r) => r.trim()).filter(Boolean);
    if (recipients.length === 0) { showToast(t("reports.toast_recipient_required"), "error"); return; }
    setCreating(true);
    try {
      let cron: string;
      if (scheduleFreq === "daily") {
        cron = `${scheduleTime.split(":")[1]} ${scheduleTime.split(":")[0]} * * *`;
      } else if (scheduleFreq === "weekly") {
        cron = `${scheduleTime.split(":")[1]} ${scheduleTime.split(":")[0]} * * 1`;
      } else {
        cron = `${scheduleTime.split(":")[1]} ${scheduleTime.split(":")[0]} 1 * *`;
      }
      const res = await fetch("/api/reports/schedules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cron, recipients }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        showToast(t("reports.toast_schedule_error", { status: res.status, text: errBody }), "error");
        return;
      }
      const { id } = (await res.json()) as { id: string };
      const newItem: Schedule = {
        id,
        name,
        frequency: scheduleFreq,
        time: scheduleTime,
        recipients,
        active: true,
      };
      setSchedules((prev) => [...prev, newItem]);
      setScheduleName("");
      setScheduleRecipients("");
      setScheduleTime("09:00");
      setNewScheduleOpen(false);
      showToast(t("reports.toast_schedule_created"));
    } catch (err) {
      showToast(
        t("reports.toast_network_error", { message: err instanceof Error ? err.message : "unknown" }),
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 p-3 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-[32px] tracking-tight">{t("reports.page_title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("reports.page_subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setScheduledOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white h-9 px-3 text-sm font-medium hover:bg-zinc-50"
        >
          <Clock className="size-4" />
          {t("reports.scheduled_reports")}
        </button>
      </div>

      {/* Generate New Report */}
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow">
        <div className="p-6">
          <h2 className="text-base font-semibold mb-4">{t("reports.generate_title")}</h2>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-zinc-500 mr-1">{t("reports.quick_range")}</span>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => applyPreset(p.value)}
                className={cn(
                  "inline-flex items-center h-7 px-3 rounded-full border text-xs font-medium transition-colors",
                  activePreset === p.value
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                )}
              >
                {t(`reports.${p.labelKey}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_1.2fr_auto] gap-4 items-end">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("reports.title")} <span className="text-zinc-400 font-normal">{t("reports.optional")}</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("reports.title_placeholder")}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {/* Template */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("reports.template")}</label>
              <div className="relative">
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full h-9 px-3 pr-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none"
                >
                  {REPORT_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.value} value={tmpl.value}>{t(`reports.${tmpl.labelKey}`)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* From */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("reports.from")}</label>
              <div className="relative">
                <input
                  ref={fromInputRef}
                  type="date"
                  value={from.split("/").reverse().join("-")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) {
                      const [y, m, d] = v.split("-").map(Number);
                      setFrom(`${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`);
                      setActivePreset(null);
                    }
                  }}
                  className="w-full h-9 px-3 pr-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("reports.to")}</label>
              <div className="relative">
                <input
                  ref={toInputRef}
                  type="date"
                  value={to.split("/").reverse().join("-")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) {
                      const [y, m, d] = v.split("-").map(Number);
                      setTo(`${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`);
                      setActivePreset(null);
                    }
                  }}
                  className="w-full h-9 px-3 pr-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Compare */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                {t("reports.compare")} <CircleHelp className="size-3.5 text-zinc-400" />
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCompareOpen(!compareOpen)}
                  className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-zinc-200 bg-white h-9 px-3 text-sm font-medium hover:bg-zinc-50 whitespace-nowrap"
                >
                  <span className="truncate">{COMPARE_OPTIONS.find((o) => o.id === compare) && t(`reports.${COMPARE_OPTIONS.find((o) => o.id === compare)!.labelKey}`)}</span>
                  <ChevronDown className="size-3.5 text-zinc-400 shrink-0" />
                </button>
                {compareOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCompareOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-zinc-200 bg-popover shadow-lg z-40 py-1 min-w-[12rem]">
                      {COMPARE_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setCompare(o.id); setCompareOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 flex items-center gap-2",
                            compare === o.id && "font-medium"
                          )}
                        >
                          <span className="size-4 inline-flex items-center justify-center">
                            {compare === o.id && <span className="size-1.5 rounded-full bg-zinc-900" />}
                          </span>
                          {t(`reports.${o.labelKey}`)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Accounts */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("reports.accounts")}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountsOpen(!accountsOpen)}
                  className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-zinc-200 bg-white h-9 px-3 text-sm font-medium hover:bg-zinc-50 whitespace-nowrap"
                >
                  <span>
                    {selectedAccounts.size === SAMPLE_ACCOUNTS.length
                      ? t("reports.all_accounts")
                      : selectedAccounts.size === 0
                        ? t("reports.accounts")
                        : t("reports.accounts_count", { n: selectedAccounts.size })}
                  </span>
                  <ChevronDown className="size-3.5 text-zinc-400" />
                </button>
                {accountsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setAccountsOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-zinc-200 bg-popover shadow-lg z-40 py-1 min-w-[16rem]">
                      <button
                        type="button"
                        onClick={toggleAllAccounts}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 flex items-center gap-2 font-medium"
                      >
                        <span className="size-4 inline-flex items-center justify-center">
                          {selectedAccounts.size === SAMPLE_ACCOUNTS.length && <Check className="size-3.5" />}
                        </span>
                        {t("reports.all_accounts")}
                      </button>
                      <div className="my-1 border-t border-zinc-100" />
                      <div className="max-h-64 overflow-y-auto">
                        {SAMPLE_ACCOUNTS.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleAccount(a.id)}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 flex items-center gap-2"
                          >
                            <span className="size-4 inline-flex items-center justify-center">
                              {selectedAccounts.has(a.id) && <Check className="size-3.5" />}
                            </span>
                            <span className="size-4 inline-flex items-center justify-center shrink-0">
                              {PLATFORM_ICONS[a.platform]}
                            </span>
                            <span className="truncate">{a.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Generate */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium invisible">{t("reports.generate")}</label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md h-9 px-4 text-sm font-medium text-white transition-colors whitespace-nowrap",
                  generating ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800"
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("reports.generating")}
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    {t("reports.generate")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Branding */}
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow">
        <button
          type="button"
          onClick={() => setBrandingOpen(!brandingOpen)}
          className="w-full flex items-center justify-between gap-3 p-6 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-blue-50 inline-flex items-center justify-center shrink-0">
              <Palette className="size-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{t("reports.branding_title")}</h2>
                <span className="text-xs text-zinc-400">{t("reports.optional")}</span>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{t("reports.branding_subtitle")}</p>
            </div>
          </div>
          {brandingOpen ? <ChevronUp className="size-5 text-zinc-400 shrink-0" /> : <ChevronDown className="size-5 text-zinc-400 shrink-0" />}
        </button>

        {brandingOpen && (
          <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 pt-4">
            {/* Accent Color */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                {t("reports.accent_color")} <CircleHelp className="size-3.5 text-zinc-400" />
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="size-9 rounded-md border border-zinc-200 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                {t("reports.footer_text")} <span className="text-zinc-400 font-normal">{t("reports.optional")}</span> <CircleHelp className="size-3.5 text-zinc-400" />
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                  placeholder={t("reports.footer_placeholder")}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-300 text-white text-sm font-medium hover:bg-zinc-400"
              >
                {t("reports.save_branding")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Your Reports */}
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">{t("reports.your_reports")}</h2>
            {reports.length > 0 ? (
              <button
                type="button"
                onClick={handleExportReports}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white h-8 px-2.5 text-xs font-medium hover:bg-zinc-50"
              >
                <Download className="size-3.5" />
                {t("reports.export_csv")}
              </button>
            ) : null}
          </div>
          {reports.length === 0 ? (
            <EmptyReports />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} onCopyLink={() => copyLink(r.id)} onDelete={() => deleteReport(r.id)} onDownloadPdf={() => handleDownloadPdf(r.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Reports side panel */}
      {scheduledOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in-0" onClick={() => setScheduledOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white shadow-xl h-full flex flex-col animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4" />
                  {t("reports.scheduled_title")}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">{t("reports.scheduled_subtitle")}</p>
              </div>
                 <button type="button" onClick={() => setScheduledOpen(false)} className="text-zinc-400 hover:text-zinc-700" aria-label={t("reports.close")}>
                 <X className="size-5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-zinc-100 flex justify-end gap-2">
              {schedules.length > 0 ? (
                <button
                  type="button"
                  onClick={handleExportSchedules}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white h-9 px-3 text-sm font-medium hover:bg-zinc-50"
                >
                  <Download className="size-4" />
                  {t("reports.export_csv")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setNewScheduleOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white h-9 px-3 text-sm font-medium hover:bg-zinc-800"
              >
                <Plus className="size-4" />
                {t("reports.new_schedule")}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {schedules.length === 0 ? (
                <EmptySchedules />
              ) : (
                <div className="p-4 space-y-3">
                  {schedules.map((s) => (
                    <ScheduleRow key={s.id} schedule={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Schedule modal */}
      {newScheduleOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-in fade-in-0" onClick={() => setNewScheduleOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 pb-3">
              <h2 className="text-lg font-semibold">{t("reports.new_schedule_title")}</h2>
              <button type="button" onClick={() => setNewScheduleOpen(false)} className="text-zinc-400 hover:text-zinc-700" aria-label={t("reports.close")}>
                 <X className="size-5" />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("reports.schedule_name")}</label>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder={t("reports.schedule_name_placeholder")}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("reports.frequency")}</label>
                <select
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value as "daily" | "weekly" | "monthly")}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="daily">{t("reports.freq_daily")}</option>
                  <option value="weekly">{t("reports.freq_weekly")}</option>
                  <option value="monthly">{t("reports.freq_monthly")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("reports.recipients")}</label>
                <input
                  type="text"
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(e.target.value)}
                  placeholder={t("reports.recipients_placeholder")}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("reports.schedule_time")}</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewScheduleOpen(false)} className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50" disabled={creating}>
                  {t("reports.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateSchedule}
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("reports.creating")}
                    </>
                  ) : (
                    t("reports.create_schedule")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-4 fade-in-0">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white shadow-lg px-4 py-3">
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Info className="size-4 text-rose-600" />
            )}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({ report, onCopyLink, onDelete, onDownloadPdf }: { report: Report; onCopyLink: () => void; onDelete: () => void; onDownloadPdf: () => void }) {
  const t = useTranslations("dashboard");
  const statusBadge = report.status === "pending"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium border border-amber-200"><Loader2 className="size-2.5 animate-spin" />{t("reports.status_generating")}</span>
    : report.status === "failed"
    ? <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-medium border border-rose-200">{t("reports.status_failed")}</span>
    : null;
  return (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50/50 transition-colors">
      <div className="size-10 rounded-lg bg-blue-50 inline-flex items-center justify-center shrink-0">
        <FileText className="size-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{report.title}</p>
          {statusBadge}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <CalendarIcon className="size-3" />
          <span>
            {report.from} — {report.to}
          </span>
          <span className="text-zinc-300">•</span>
          <span className="capitalize">{report.template}</span>
          <span className="text-zinc-300">•</span>
           <span>{t("reports.created_date", { date: report.createdAt })}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50">
          <Eye className="size-3.5" />
          {t("reports.view")}
        </button>
        <button type="button" onClick={onCopyLink} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50">
          <CopyIcon className="size-3.5" />
          {t("reports.copy_link")}
        </button>
        <button type="button" onClick={onDownloadPdf} disabled={report.status === "pending"} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed">
          <Download className="size-3.5" />
          {t("reports.pdf")}
        </button>
        <button type="button" onClick={onDelete} className="inline-flex items-center justify-center size-8 rounded-md border border-rose-200 bg-white text-rose-600 hover:bg-rose-50" aria-label={t("reports.delete")}>
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyReports() {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <FileText className="size-6 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-900">{t("reports.empty_title")}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">{t("reports.empty_subtitle")}</p>
    </div>
  );
}

function EmptySchedules() {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <Clock className="size-10 text-zinc-300 mb-3" />
      <p className="text-sm font-semibold text-zinc-900">{t("reports.schedules_empty")}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">{t("reports.schedules_empty_sub")}</p>
    </div>
  );
}

function ScheduleRow({ schedule }: { schedule: Schedule }) {
  const t = useTranslations("dashboard");
  const freqLabel = schedule.frequency === "daily" ? t("reports.freq_daily") : schedule.frequency === "weekly" ? t("reports.freq_weekly") : t("reports.freq_monthly");
  return (
    <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{schedule.name}</p>
        <div className="flex items-center gap-1">
          <button type="button" className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100" aria-label={t("reports.schedule_edit")}>
            <Pencil className="size-3.5 text-zinc-600" />
          </button>
          <button type="button" className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100" aria-label={t("reports.schedule_toggle")}>
            {schedule.active ? <Pause className="size-3.5 text-zinc-600" /> : <Play className="size-3.5 text-zinc-600" />}
          </button>
          <button type="button" className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-rose-600" aria-label={t("reports.schedule_delete")}>
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">{t("reports.schedule_freq", { freqLabel, time: schedule.time })}</p>
      <p className="text-xs text-zinc-500">{t("reports.schedule_recipients", { n: schedule.recipients.length })}</p>
    </div>
  );
}