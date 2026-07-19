"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  UserCheck,
  CreditCard,
  Ban,
  RotateCcw,
  Trash2,
  KeyRound,
  FileText,
  ExternalLink,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Globe,
} from "lucide-react";
import {
  changeUserPlanAction,
  suspendUserAction,
  unsuspendUserAction,
  deleteUserAction,
  impersonateUserAction,
  sendPasswordResetAction,
} from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export interface UserRow {
  id: string;
  uid: string;
  name: string;
  email: string;
  plan: string;
  status: "active" | "suspended" | "trialing" | "deleted";
  connectedAccounts: number;
  joined: string;
  lastActive: string;
  photoURL?: string | null;
  ipAddress?: string;
  device?: string;
}

export function UsersTableClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [globalFilter, setGlobalFilter] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const { toast } = useToast();

  // Slide-over user profile detail state
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Modals state
  const [planModalUser, setPlanModalUser] = useState<UserRow | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState("Pro");
  const [deleteModalUser, setDeleteModalUser] = useState<UserRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (planFilter !== "all" && u.plan.toLowerCase() !== planFilter.toLowerCase()) return false;
      if (statusFilter !== "all" && u.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (
        globalFilter &&
        !u.name.toLowerCase().includes(globalFilter.toLowerCase()) &&
        !u.email.toLowerCase().includes(globalFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [users, planFilter, statusFilter, globalFilter]);

  // Handle Impersonation
  const handleImpersonate = async (user: UserRow) => {
    try {
      setActionLoading(true);
      const res = await impersonateUserAction(user.uid);
      toast({
        title: "Impersonation Token Generated",
        description: `Generated token for ${user.email}. Redirecting...`,
        tone: "success",
      });
      window.open(`/dashboard?impersonate=${res.customToken}`, "_blank");
    } catch (err: any) {
      toast({ title: "Impersonation Failed", description: err.message, tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Change Plan
  const handleChangePlanSubmit = async () => {
    if (!planModalUser) return;
    try {
      setActionLoading(true);
      await changeUserPlanAction(planModalUser.uid, selectedNewPlan);
      setUsers((prev) =>
        prev.map((u) => (u.uid === planModalUser.uid ? { ...u, plan: selectedNewPlan } : u))
      );
      toast({ title: "Plan Updated", description: `Updated plan to ${selectedNewPlan}`, tone: "success" });
      setPlanModalUser(null);
    } catch (err: any) {
      toast({ title: "Failed to update plan", description: err.message, tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Suspend / Unsuspend
  const handleToggleSuspend = async (user: UserRow) => {
    try {
      setActionLoading(true);
      if (user.status === "suspended") {
        await unsuspendUserAction(user.uid);
        setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, status: "active" } : u)));
        toast({ title: "Account Unsuspended", description: `${user.email} is now active.`, tone: "success" });
      } else {
        await suspendUserAction(user.uid);
        setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, status: "suspended" } : u)));
        toast({ title: "Account Suspended", description: `${user.email} has been suspended.`, tone: "error" });
      }
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteSubmit = async () => {
    if (!deleteModalUser) return;
    try {
      setActionLoading(true);
      await deleteUserAction(deleteModalUser.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== deleteModalUser.uid));
      toast({ title: "User Deleted", description: `Deleted ${deleteModalUser.email}`, tone: "success" });
      setDeleteModalUser(null);
    } catch (err: any) {
      toast({ title: "Failed to delete user", description: err.message, tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (user: UserRow) => {
    try {
      await sendPasswordResetAction(user.email);
      toast({ title: "Password Reset Sent", description: `Reset email sent to ${user.email}`, tone: "info" });
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err.message, tone: "error" });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "UID,Name,Email,Plan,Status,JoinedDate\n";
    const rows = filteredUsers
      .map((u) => `"${u.uid}","${u.name}","${u.email}","${u.plan}","${u.status}","${u.joined}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postplanify-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({ title: "Export Complete", description: "CSV file downloaded successfully", tone: "success" });
  };

  // Table Columns Definition
  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-gradient-to-br from-teal-500 to-[#01696f] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{u.name}</p>
                <p className="text-[11px] text-gray-500">{u.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => {
          const plan = row.original.plan;
          const planColors: Record<string, string> = {
            Free: "bg-gray-100 text-gray-700 border-gray-200",
            Pro: "bg-teal-50 text-teal-800 border-teal-200 font-semibold",
            Business: "bg-sky-50 text-sky-800 border-sky-200 font-semibold",
            Agency: "bg-purple-50 text-purple-800 border-purple-200 font-bold",
          };
          return (
            <span className={`px-2.5 py-1 text-[11px] rounded-full border ${planColors[plan] || planColors.Free}`}>
              {plan}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "suspended") {
            return <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Suspended</span>;
          }
          if (status === "trialing") {
            return <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Free Trial</span>;
          }
          return <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Active</span>;
        },
      },
      {
        accessorKey: "connectedAccounts",
        header: "Accounts",
        cell: ({ row }) => <span className="text-xs font-semibold text-gray-700">{row.original.connectedAccounts} connected</span>,
      },
      {
        accessorKey: "joined",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {new Date(row.original.joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const u = row.original;
          const [dropdownOpen, setDropdownOpen] = useState(false);

          return (
            <div className="relative flex justify-end">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="size-3.5 text-gray-500" />
                    View Profile
                  </button>
                  <button
                    onClick={() => handleImpersonate(u)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-teal-700 hover:bg-teal-50 font-semibold"
                  >
                    <UserCheck className="size-3.5 text-teal-600" />
                    Impersonate User
                  </button>
                  <button
                    onClick={() => setPlanModalUser(u)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <CreditCard className="size-3.5 text-gray-500" />
                    Change Plan
                  </button>
                  <button
                    onClick={() => handleToggleSuspend(u)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 ${
                      u.status === "suspended" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    {u.status === "suspended" ? (
                      <>
                        <RotateCcw className="size-3.5" />
                        Unsuspend Account
                      </>
                    ) : (
                      <>
                        <Ban className="size-3.5" />
                        Suspend Account
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleResetPassword(u)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <KeyRound className="size-3.5 text-gray-500" />
                    Send Password Reset
                  </button>
                  <Link
                    href={`/admin/posts?userId=${u.uid}`}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="size-3.5 text-gray-500" />
                    View Posts
                  </Link>
                  <button
                    onClick={() => setDeleteModalUser(u)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 border-t border-gray-100"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:bg-white"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="agency">Agency</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Free Trial</option>
          </select>
        </div>

        {/* CSV Export */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#01696f] hover:bg-[#015257] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-3.5">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400">
                    No users matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {table.getRowModel().rows.length} of {filteredUsers.length} users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Slide-over Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-6 z-50 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900">User Profile Details</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-gray-400 hover:text-gray-700">
                <X className="size-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="size-12 rounded-full bg-[#01696f] text-white font-bold text-lg flex items-center justify-center">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded">
                    {selectedUser.plan}
                  </span>
                  <span className="text-[10px] text-gray-400">UID: {selectedUser.uid}</span>
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Security & Diagnostics</h4>
              <div className="bg-gray-50 p-4 rounded-xl space-y-2.5 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Globe className="size-3.5" /> Last IP Address:</span>
                  <span className="font-mono font-medium">{selectedUser.ipAddress || "198.51.100.42"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Smartphone className="size-3.5" /> Device:</span>
                  <span className="font-medium">{selectedUser.device || "Chrome / Windows"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined Date:</span>
                  <span>{new Date(selectedUser.joined).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => handleImpersonate(selectedUser)}
                className="w-full py-2.5 bg-[#01696f] text-white text-xs font-bold rounded-xl hover:bg-[#015257] transition-colors"
              >
                Impersonate Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900">Change Plan for {planModalUser.name}</h3>
            <p className="text-xs text-gray-500">Select a new subscription tier:</p>
            <select
              value={selectedNewPlan}
              onChange={(e) => setSelectedNewPlan(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#01696f]"
            >
              <option value="Free">Free ($0/mo)</option>
              <option value="Pro">Pro ($79/mo)</option>
              <option value="Business">Business ($159/mo)</option>
              <option value="Agency">Agency ($239/mo)</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPlanModalUser(null)} className="px-4 py-2 text-xs border rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleChangePlanSubmit}
                disabled={actionLoading}
                className="px-4 py-2 text-xs bg-[#01696f] text-white font-bold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="size-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
            <h3 className="font-bold text-gray-900">Delete Account?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to permanently delete <strong>{deleteModalUser.email}</strong>? This action will cancel Stripe subscriptions and mark posts as deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteModalUser(null)} className="px-4 py-2 text-xs border rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="px-4 py-2 text-xs bg-rose-600 text-white font-bold rounded-xl"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
