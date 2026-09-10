export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    // Background workers are intentionally manual. Starting recurring
    // Firestore polls here exhausts the daily database quota even when no
    // user is actively using the dashboard. The worker tick functions remain
    // available through authenticated manual actions.
  }
}
