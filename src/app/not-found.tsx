import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 h-10 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-4 h-10 text-sm font-medium hover:bg-zinc-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
