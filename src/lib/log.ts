/**
 * Lightweight structured logger. Wraps `console.*` with a stable `[module]`
 * prefix and (optionally) forwards to Sentry if it's been initialised.
 *
 * Goals:
 *  - Drop-in replacement for `console.*` with the same call signature.
 *  - Preserve the existing prefix convention so log greppability stays the same.
 *  - One place to add context tags / breadcrumbs when Sentry is wired up.
 *  - Zero overhead when Sentry is not initialised (DSN unset).
 *
 * Usage:
 *   import { createLogger } from "@/lib/log";
 *   const log = createLogger("posts/publish");
 *   log.warn("Firestore write failed", { err });
 *   log.error(err, { route: "/api/posts/publish" });
 */

type Level = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

interface SentryLike {
  captureException: (err: unknown, ctx?: { tags?: Record<string, string>; extra?: Record<string, unknown> }) => void;
  captureMessage: (msg: string, level?: "info" | "warning" | "error", ctx?: { tags?: Record<string, string>; extra?: Record<string, unknown> }) => void;
  addBreadcrumb: (crumb: { message: string; level?: "info" | "warning" | "error"; data?: Record<string, unknown> }) => void;
}

let sentryRef: SentryLike | null = null;

/**
 * Set the Sentry instance to forward logs to. Called once by
 * `sentry.server.config.ts` / `sentry.client.config.ts` after Sentry.init.
 * Pass `null` to disable forwarding (used in tests).
 */
export function setSentrySink(s: SentryLike | null): void {
  sentryRef = s;
}

export interface Logger {
  debug(msg: string, context?: LogContext): void;
  info(msg: string, context?: LogContext): void;
  warn(msg: string, context?: LogContext): void;
  error(errOrMsg: unknown, context?: LogContext): void;
}

function fmt(level: Level, module: string, payload: string | unknown, context?: LogContext): unknown[] {
  const prefix = `[${module}]`;
  const ctxStr = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
  if (typeof payload === "string") {
    return [`${prefix} ${payload}${ctxStr}`];
  }
  // Error path: keep the leading summary string then attach the error as a second arg
  // so dev consoles render it as an expandable object instead of stringifying to "{}".
  return [`${prefix}${ctxStr}`, payload];
}

function extractError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

export function createLogger(module: string): Logger {
  const consoleMethod = (level: Exclude<Level, "debug">): ((...args: unknown[]) => void) => {
    switch (level) {
      case "info":
        return console.info.bind(console);
      case "warn":
        return console.warn.bind(console);
      case "error":
        return console.error.bind(console);
    }
  };

  return {
    debug(msg, context) {
      if (process.env.NODE_ENV === "production") return; // skip debug in prod
      consoleMethod("info")(...fmt("debug", module, msg, context));
    },
    info(msg, context) {
      consoleMethod("info")(...fmt("info", module, msg, context));
      sentryRef?.addBreadcrumb({ message: `[${module}] ${msg}`, level: "info", data: context });
    },
    warn(msg, context) {
      consoleMethod("warn")(...fmt("warn", module, msg, context));
      sentryRef?.captureMessage(`[${module}] ${msg}`, "warning", { tags: { module }, extra: context });
    },
    error(errOrMsg, context) {
      const { message, stack } = extractError(errOrMsg);
      consoleMethod("error")(...fmt("error", module, errOrMsg, context));
      // Synthetic Error so Sentry groups by message+stack rather than "[object Object]".
      const synthetic = new Error(message);
      if (stack) synthetic.stack = stack;
      sentryRef?.captureException(synthetic, {
        tags: { module, ...(context?.route ? { route: String(context.route) } : {}) },
        extra: context,
      });
    },
  };
}
