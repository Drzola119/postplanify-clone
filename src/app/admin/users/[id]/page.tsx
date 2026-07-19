// Fix #9 — dynamic user detail page for deep-linking
import { getUsersData } from "../../actions";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `User ${params.id} — PostPlanify Admin` };
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const users = await getUsersData();
  const user = users.find((u: any) => u.id === params.id || u.uid === params.id);

  if (!user) notFound();

  const fields: { label: string; value: string }[] = [
    { label: "Email", value: user.email },
    { label: "Plan", value: user.plan },
    { label: "Status", value: user.status },
    { label: "Connected Accounts", value: String(user.connectedAccounts) },
    { label: "Joined", value: new Date(user.joined).toLocaleString() },
    { label: "Last Active", value: new Date(user.lastActive).toLocaleString() },
    { label: "IP Address", value: user.ipAddress },
    { label: "Device", value: user.device },
  ];

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        ← All Users
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="size-14 rounded-full bg-gradient-to-tr from-[#01696f] to-teal-400 text-white font-bold text-xl flex items-center justify-center shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span
            className={`ml-auto px-3 py-1 text-xs font-semibold rounded-full ${
              user.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : user.status === "suspended"
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {user.status}
          </span>
        </div>

        {/* Field grid */}
        <dl className="divide-y divide-gray-100">
          {fields.map(({ label, value }) => (
            <div key={label} className="px-6 py-4 grid grid-cols-2 gap-4">
              <dt className="text-sm font-medium text-gray-500">{label}</dt>
              <dd className="text-sm text-gray-900 font-mono break-all">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Quick actions */}
        <div className="p-6 border-t border-gray-100 flex flex-wrap gap-3">
          <Link
            href={`/admin/users?q=${encodeURIComponent(user.email)}`}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Search Posts
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}
