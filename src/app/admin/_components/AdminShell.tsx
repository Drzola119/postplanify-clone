"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserX,
  UserCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  Clock,
  AlertOctagon,
  Share2,
  DollarSign,
  Flag,
  Megaphone,
  Mail,
  Ticket,
  Terminal,
  ShieldAlert,
  Activity,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  ArrowLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "USERS",
    items: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Banned Users", href: "/admin/users/banned", icon: UserX },
      { label: "User Impersonation", href: "/admin/users/impersonate", icon: UserCheck },
    ],
  },
  {
    title: "SUBSCRIPTIONS & BILLING",
    items: [
      { label: "Plans Overview", href: "/admin/subscriptions", icon: CreditCard },
      { label: "Active Subs", href: "/admin/subscriptions/active", icon: CheckCircle2 },
      { label: "Churned / Cancelled", href: "/admin/subscriptions/churned", icon: XCircle },
      { label: "Revenue", href: "/admin/subscriptions/revenue", icon: TrendingUp },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "All Posts", href: "/admin/posts", icon: FileText },
      { label: "Scheduled Queue", href: "/admin/posts/queue", icon: Clock },
      { label: "Failed Posts", href: "/admin/posts/failed", icon: AlertOctagon },
    ],
  },
  {
    title: "AFFILIATES",
    items: [
      { label: "Affiliates", href: "/admin/affiliates", icon: Share2 },
      { label: "Commissions", href: "/admin/affiliates/commissions", icon: DollarSign },
    ],
  },
  {
    title: "PLATFORM",
    items: [
      { label: "Feature Flags", href: "/admin/settings/flags", icon: Flag },
      { label: "Announcements", href: "/admin/settings/announcements", icon: Megaphone },
      { label: "Email Broadcasts", href: "/admin/settings/email", icon: Mail },
      { label: "Coupons / Promo", href: "/admin/settings/coupons", icon: Ticket },
      { label: "API Logs", href: "/admin/logs", icon: Terminal },
      { label: "Security Events", href: "/admin/logs/security", icon: ShieldAlert },
      { label: "System Health", href: "/admin/health", icon: Activity },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/users?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  // Derive breadcrumbs from current path
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageTitle = pathSegments.length <= 1 ? "Dashboard" : pathSegments[pathSegments.length - 1].replace(/-/g, " ");

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-gray-300">
      {/* Brand header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#01696f] flex items-center justify-center text-white font-bold shadow-md shadow-[#01696f]/20">
            P
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide">PostPlanify</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-teal-400 bg-teal-950 border border-teal-800 rounded uppercase">
              Admin
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-gray-800 text-white font-semibold border-l-4 border-[#01696f] pl-2.5"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                    }`}
                  >
                    <Icon className={`size-4 ${isActive ? "text-[#01696f]" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick link back to User App */}
      <div className="p-4 border-t border-gray-800 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to User App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      {/* Desktop Sidebar (260px wide) */}
      <aside className="hidden md:block w-65 shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-65 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 capitalize">
              <span className="font-medium text-gray-400">Admin</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">{pageTitle}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Global Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:bg-white transition-all"
              />
            </form>

            {/* Notification Bell */}
            <div className="relative">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
            </div>

            {/* Admin Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="size-8 rounded-full bg-gradient-to-tr from-[#01696f] to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  E
                </div>
                <div className="hidden lg:block text-left pr-1">
                  <p className="text-xs font-semibold leading-tight text-gray-900">Edy Labels</p>
                  <p className="text-[10px] text-gray-500">Super Admin</p>
                </div>
                <ChevronDown className="size-3.5 text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900">edylabels@gmail.com</p>
                    <p className="text-[10px] text-teal-600 font-medium">System Administrator</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Sparkles className="size-3.5 text-teal-600" />
                    Back to User App
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="size-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
