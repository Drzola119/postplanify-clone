import Link from "next/link";

export default function MCP() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">PostPlanify MCP</h1>
      <p className="mt-4 text-muted-foreground max-w-md">
        Connect your AI to PostPlanify via the Model Context Protocol.
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
