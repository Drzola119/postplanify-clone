// Next.js instrumentation hook. Required by @sentry/nextjs to load the SDK
// once per server start. Runs in both Node and Edge runtimes; we only init
// on Node here. See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
}
