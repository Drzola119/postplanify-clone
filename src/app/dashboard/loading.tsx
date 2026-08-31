export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-zinc-200 rounded" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 bg-zinc-100 rounded-lg" />
        <div className="h-28 bg-zinc-100 rounded-lg" />
        <div className="h-28 bg-zinc-100 rounded-lg" />
      </div>
      <div className="h-64 bg-zinc-50 rounded-lg border border-zinc-200" />
    </div>
  );
}
