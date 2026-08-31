export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" aria-hidden />
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    </div>
  );
}
