"use client";

export function NewsletterForm() {
  return (
    <form className="mt-3 space-y-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        required
        placeholder="you@example.com"
        className="w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-2 ring-transparent transition placeholder:text-gray-400 focus:ring-white/80"
      />
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900"
      >
        Subscribe
      </button>
    </form>
  );
}
