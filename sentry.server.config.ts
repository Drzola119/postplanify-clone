// Server-side Sentry init. Only initializes when SENTRY_DSN is set; otherwise
// this file is a no-op so the SDK never loads and never phones home.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    environment: process.env.NODE_ENV,
    // Server-side: don't track PII by default; allow opt-in via tag in logger.
    sendDefaultPii: false,
  });
  // Wire the SDK into the structured logger so existing console.* calls
  // (now migrated to logger.warn / logger.error) surface as Sentry events.
  // Lazy import avoids a hard dep on @sentry/nextjs from log.ts.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  void import("@/lib/log").then(({ setSentrySink }) => {
    setSentrySink({
      captureException: (err, ctx) => Sentry.captureException(err, ctx),
      captureMessage: (msg, level, ctx) => Sentry.captureMessage(msg, { level, ...ctx }),
      addBreadcrumb: (crumb) => Sentry.addBreadcrumb(crumb),
    });
  });
}
