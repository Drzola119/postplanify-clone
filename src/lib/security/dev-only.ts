/**
 * Public surface for the security module. Mark this file as client-safe
 * so non-server-only callers (e.g. layout, dashboard pages) can check
 * whether overrides are honored without importing server-only modules.
 */

const isProd = process.env.NODE_ENV === "production";
const allowClientOverrides = process.env.NEXT_PUBLIC_ALLOW_CLIENT_OVERRIDES === "1";

/**
 * Whether the current build lets dashboard pages pass client-supplied
 * integration overrides (e.g. upload-post key) via x-* headers.
 *
 * Off in production unless NEXT_PUBLIC_ALLOW_CLIENT_OVERRIDES=1 is set.
 * Off in production builds by default for security hygiene.
 */
export function clientOverridesAllowed(): boolean {
  return !isProd || allowClientOverrides;
}
