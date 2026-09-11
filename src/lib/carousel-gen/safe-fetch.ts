import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";

export function isPublicAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  // Global unicast only; reject mapped IPv4 and transition ranges.
  return (
    isIP(ip) === 6 &&
    /^[23]/.test(ip) &&
    !ip.startsWith("2001:") &&
    !ip.startsWith("2002:")
  );
}

/** Resolve, validate and pin DNS on every redirect. Never pass cookies or credentials. */
export async function safeFetch(
  url: string,
  maxBytes = 2_000_000,
  redirects = 0,
): Promise<{ body: Buffer; type: string }> {
  if (redirects > 4) throw Error("Too many redirects");
  const target = new URL(url);
  if (
    !["https:", "http:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    (target.port && !["80", "443"].includes(target.port))
  )
    throw Error("Unsupported URL");
  const hostname = target.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some((entry) => !isPublicAddress(entry.address))
  )
    throw Error("Private network addresses are not allowed");
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const transport = target.protocol === "https:" ? https : http;
    const req = transport.get(
      target,
      {
        family: pinned.family,
        lookup: (_host, _options, done) =>
          done(null, pinned.address, pinned.family),
        headers: {
          Accept: "text/html,text/plain,image/png,image/jpeg,image/webp",
          "User-Agent": "CarouselStudio/1.0",
        },
      },
      (response) => {
        if (
          [301, 302, 303, 307, 308].includes(response.statusCode ?? 0) &&
          response.headers.location
        ) {
          response.resume();
          resolve(
            safeFetch(
              new URL(response.headers.location, target).href,
              maxBytes,
              redirects + 1,
            ),
          );
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(Error(`Source returned HTTP ${response.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            response.destroy(Error("Source exceeds size limit"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () =>
          resolve({
            body: Buffer.concat(chunks),
            type: String(response.headers["content-type"] || "").split(";")[0],
          }),
        );
      },
    );
    const timer = setTimeout(
      () => req.destroy(Error("Source timed out")),
      15000,
    );
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
  });
}
