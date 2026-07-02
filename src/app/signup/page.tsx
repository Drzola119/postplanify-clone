import Link from "next/link";

export default function Signup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Sign Up</h1>
      <p className="mt-4 text-muted-foreground max-w-md">
        Start your 7-day free trial. No charge today, cancel anytime.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 font-medium transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
