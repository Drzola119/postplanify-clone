"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  FileText,
  BarChart3,
  FileBarChart,
  Inbox,
  Image as ImageIcon,
  Building2,
  Users,
  ListChecks,
  Hash,
  Tag,
  Settings,
  LifeBuoy,
  DollarSign,
  Link2,
  Key,
  ChevronDown,
  Bell,
  BookOpen,
  Plus,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  History,
  Zap,
  Wand2,
  Palette,
  Send,
  Sparkles,
} from "lucide-react";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/lib/security/storage-keys";
import { cn } from "@/lib/utils";
import { useDrawer } from "@/components/dashboard/drawer-provider";
import { UserMenu } from "@/components/dashboard/user-menu";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useHelpSystem } from "@/components/dashboard/help/help-system";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

interface SidebarWorkspace {
  id: string;
  name: string;
}

interface AccountHealthSummary {
  total: number;
  healthy: number;
  needsReauth: number;
  stale: number;
  disconnected: number;
}

/**
 * Three states for the workspace selector:
 *  - "loading": initial fetch in flight, show "Loading…"
 *  - "unauthorized": 401 — session cookie stale, or server auth misconfigured
 *  - "ready": workspaces list is loaded
 */
type WorkspaceLoadState = "loading" | "unauthorized" | "ready";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number };

const MAIN: NavItem[] = [
  { label: "Calendar", href: "/dashboard/posts", icon: Calendar, badge: 0 },
  { label: "Drafts", href: "/dashboard/posts/drafts", icon: FileText },
  { label: "Queue", href: "/dashboard/queue", icon: ListChecks },
  { label: "History", href: "/dashboard/posts/history", icon: History },
  { label: "Command Center", href: "/dashboard/command-center", icon: Zap },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Social Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Media Library", href: "/dashboard/assets", icon: ImageIcon },
  { label: "Infographics", href: "/dashboard/infographics", icon: Sparkles },
];

const CONFIG: NavItem[] = [
  { label: "Workspaces", href: "/dashboard/brands", icon: Building2 },
  { label: "Accounts", href: "/dashboard/accounts", icon: Users },
  { label: "Automations", href: "/dashboard/automations/dm", icon: Wand2 },
  { label: "Destinations", href: "/dashboard/destinations", icon: Send },
  { label: "Branding", href: "/dashboard/settings/branding", icon: Palette },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

type DrawerKey = "schedule" | "hashtags" | "labels";
const CONFIG_DRAWERS: { label: string; icon: React.ComponentType<{ className?: string }>; drawer: DrawerKey }[] = [
  { label: "Posting Queue", icon: ListChecks, drawer: "schedule" },
  { label: "Hashtags", icon: Hash, drawer: "hashtags" },
  { label: "Labels", icon: Tag, drawer: "labels" },
];

const OTHER: NavItem[] = [
  { label: "Get Support", href: "mailto:support@postplanify.com", icon: LifeBuoy },
  { label: "Earn 40% Referral", href: "/affiliates", icon: DollarSign },
  { label: "Link in Bio", href: "/dashboard/link-in-bio", icon: Link2 },
  { label: "API Keys", href: "/dashboard/api-keys", icon: Key, badge: 6 },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 h-9 text-sm transition-colors",
        active
          ? "bg-zinc-100 text-zinc-900 font-semibold"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {typeof item.badge === "number" && item.badge >= 0 ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
          <span className="text-orange-500">🔥</span>
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function DrawerNavButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 h-9 text-sm transition-colors text-left",
        "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-3 pt-5 pb-1.5 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
      {children}
    </h2>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<SidebarWorkspace[]>([]);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceLoadState>("loading");
  const [activeWorkspace, setActiveWorkspace] = useState<string>("");
  const [health, setHealth] = useState<AccountHealthSummary | null>(null);
  const [healthError, setHealthError] = useState<"unauthorized" | "other" | null>(null);
  const { openDrawer } = useDrawer();
  const { openLearn } = useHelpSystem();

  // Hydrate workspace list from /api/workspaces. Track three terminal
  // states: "loading" (initial fetch), "unauthorized" (401 → user must
  // re-login OR server is misconfigured), "ready" (loaded).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspaces", {
          credentials: "include",
          headers: getOverrideHeaders(),
        });
        if (cancelled) return;
        if (res.status === 401) {
          setWorkspaceState("unauthorized");
          return;
        }
        if (!res.ok) {
          // Treat non-401 failures as "empty list" so the user can still
          // try to create a workspace.
          setWorkspaceState("ready");
          return;
        }
        const data = (await res.json()) as { workspaces?: SidebarWorkspace[] };
        if (cancelled) return;
        if (!data.workspaces) {
          setWorkspaceState("ready");
          return;
        }
        setWorkspaces(data.workspaces);
        const persistedId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
            : null;
        const validPersisted =
          persistedId && data.workspaces.some((w) => w.id === persistedId)
            ? persistedId
            : null;
        setActiveWorkspace(
          (current) => current || validPersisted || data.workspaces![0]?.id || ""
        );
        setWorkspaceState("ready");
      } catch {
        if (!cancelled) setWorkspaceState("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate connections health from /api/accounts/health. Track 401
  // separately so the widget can show an actionable hint instead of a
  // permanent "Loading…".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/accounts/health", {
          credentials: "include",
          headers: getOverrideHeaders(),
        });
        if (cancelled) return;
        if (res.status === 401) {
          setHealthError("unauthorized");
          return;
        }
        if (!res.ok) {
          setHealthError("other");
          return;
        }
        const data = (await res.json()) as { health?: AccountHealthSummary };
        if (data.health && !cancelled) setHealth(data.health);
      } catch {
        if (!cancelled) setHealthError("other");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateWorkspace = async () => {
    const name = window.prompt("Workspace name?");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        window.alert("Could not create workspace. Please try again.");
        return;
      }
      const data = (await res.json()) as { id?: string };
      if (!data.id) return;
      // Refresh list and select the new one.
      const listRes = await fetch("/api/workspaces", { credentials: "include", headers: getOverrideHeaders() });
      if (listRes.ok) {
        const listData = (await listRes.json()) as { workspaces?: SidebarWorkspace[] };
        if (listData.workspaces) {
          setWorkspaces(listData.workspaces);
          setActiveWorkspace(data.id);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, data.id);
          }
        }
      }
    } catch {
      window.alert("Could not create workspace. Please try again.");
    }
  };

  const onWorkspaceChange = (v: string) => {
    if (v === "__create__") {
      handleCreateWorkspace();
      return;
    }
    setActiveWorkspace(v);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, v);
    }
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 z-40 bg-white border-r border-zinc-200 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 shrink-0">
        <Link href="/dashboard/posts" className="flex items-center gap-2">
          <Image
            src="/images/postplanify/https___postplanify.com__next_image_url__2Flogo.png_w_64_q_75"
            alt="PostPlanify"
            width={24}
            height={24}
            className="rounded"
          />
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight">PostPlanify</span>}
        </Link>
        {!collapsed && (
          <div className="flex items-center gap-0.5">
            <LocaleSwitcher />
            <button
              type="button"
              onClick={() => openLearn()}
              className="inline-flex items-center justify-center size-7 rounded-md hover:bg-zinc-100"
              aria-label="Open Learn panel"
              title="Learn"
            >
              <BookOpen className="size-4 text-zinc-500" />
            </button>
            <button
              type="button"
              className="relative inline-flex items-center justify-center size-7 rounded-md hover:bg-zinc-100"
              aria-label="Notifications"
            >
              <Bell className="size-4 text-zinc-500" />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <select
              value={activeWorkspace}
              onChange={(e) => onWorkspaceChange(e.target.value)}
              className="w-full appearance-none rounded-md border border-zinc-200 bg-white pl-8 pr-7 h-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              aria-label="Switch workspace"
            >
              {workspaceState === "loading" ? (
              <option value="">Loading…</option>
            ) : workspaceState === "unauthorized" ? (
              <option value="">Re-login required</option>
            ) : workspaces.length === 0 ? (
              <option value="">No workspaces yet</option>
            ) : (
              workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))
            )}
              <option value="__create__">+ Create Workspace</option>
            </select>
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Top CTAs */}
      {!collapsed && (
        <div className="px-3 pt-2 space-y-1.5">
          <Link
            href="/dashboard/posts/create"
            className="flex items-center justify-center gap-2 h-9 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            Create Post
          </Link>
          <Link
            href="/dashboard/posts/bulk-schedule"
            className="flex items-center justify-center gap-2 h-9 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 text-zinc-700"
          >
            <CalendarPlus className="size-4" />
            Bulk Schedule
          </Link>
        </div>
      )}

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto pb-3">
        {!collapsed && <SectionLabel>Main</SectionLabel>}
        <div className="px-3 space-y-0.5">
          {MAIN.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>

        {!collapsed && <SectionLabel>Configuration</SectionLabel>}
        <div className="px-3 space-y-0.5">
          {CONFIG.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          {CONFIG_DRAWERS.map((d) => (
            <DrawerNavButton
              key={d.drawer}
              label={d.label}
              icon={d.icon}
              onClick={() => openDrawer(d.drawer)}
            />
          ))}
        </div>

        {!collapsed && <SectionLabel>Other</SectionLabel>}
        <div className="px-3 space-y-0.5">
          {OTHER.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
      </nav>

      {/* Connections widget */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/accounts"
            className="block rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Users className="size-3.5 text-emerald-700" />
              </div>
              <p className="text-xs font-semibold text-emerald-900 flex-1">Connections</p>
              <p className="text-xs font-semibold text-emerald-700">
                {health ? `${health.healthy} healthy` : "—"}
              </p>
            </div>
            <p className="mt-1.5 text-[11px] text-emerald-800/80">
              {health
                ? health.needsReauth > 0 || health.stale > 0 || health.disconnected > 0
                  ? `${health.total} total · ${[
                      health.needsReauth > 0 ? `${health.needsReauth} need reauth` : null,
                      health.stale > 0 ? `${health.stale} stale` : null,
                      health.disconnected > 0 ? `${health.disconnected} disconnected` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}`
                  : `${health.total} connected · all healthy`
                : healthError === "unauthorized"
                  ? "Sign in again to view connections"
                  : healthError === "other"
                    ? "Could not load — retry"
                    : "Loading…"}
            </p>
          </Link>
        </div>
      )}

      {/* User profile */}
      {!collapsed && <UserMenu />}

      {!collapsed && (
        <div className="px-3 pb-3 flex items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500">Growth Plan</span>
          <span className="text-zinc-400">⚙️</span>
        </div>
      )}

      {/* Collapse button */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-1/2 -right-3 -translate-y-1/2 z-50 size-6 rounded-full bg-white border border-zinc-200 inline-flex items-center justify-center hover:bg-zinc-50 text-zinc-500 shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>
    </aside>
  );
}