// Client-side Sentry init. Reads NEXT_PUBLIC_SENTRY_DSN. No-op when unset.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
  });
  void import("@/lib/log").then(({ setSentrySink }) => {
    setSentrySink({
      captureException: (err, ctx) => Sentry.captureException(err, ctx),
      captureMessage: (msg, level, ctx) => Sentry.captureMessage(msg, { level, ...ctx }),
      addBreadcrumb: (crumb) => Sentry.addBreadcrumb(crumb),
    });
  });
}
