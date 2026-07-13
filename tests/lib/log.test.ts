import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, setSentrySink } from "@/lib/log";

describe("lib/log - createLogger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    setSentrySink(null);
  });

  it("prefixes messages with [module] and forwards to console.*", () => {
    const log = createLogger("test/module");
    log.info("hello");
    expect(infoSpy).toHaveBeenCalledOnce();
    expect(infoSpy.mock.calls[0][0]).toMatch(/^\[test\/module\] hello$/);
  });

  it("warn logs to console.warn and does not throw when Sentry unset", () => {
    const log = createLogger("warn-mod");
    expect(() => log.warn("careful")).not.toThrow();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("[warn-mod] careful");
  });

  it("error accepts either string or Error and routes to console.error", () => {
    const log = createLogger("err-mod");
    log.error("plain string");
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockClear();

    const e = new Error("boom");
    log.error(e, { route: "/api/x" });
    expect(errorSpy).toHaveBeenCalledOnce();
    // Second arg should be the original Error so dev consoles expand it.
    expect(errorSpy.mock.calls[0][1]).toBe(e);
  });

  it("forwards warn messages to the Sentry sink when set", () => {
    const captureMessage = vi.fn();
    setSentrySink({
      captureException: vi.fn(),
      captureMessage,
      addBreadcrumb: vi.fn(),
    });
    const log = createLogger("sentry-mod");
    log.warn("sentry test", { extra: 1 });
    expect(captureMessage).toHaveBeenCalledWith(
      "[sentry-mod] sentry test",
      "warning",
      expect.objectContaining({ tags: { module: "sentry-mod" }, extra: { extra: 1 } })
    );
  });

  it("forwards errors as exceptions to the Sentry sink", () => {
    const captureException = vi.fn();
    setSentrySink({
      captureException,
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    });
    const log = createLogger("err-sentry");
    const e = new Error("downstream failure");
    log.error(e, { route: "/api/y" });
    expect(captureException).toHaveBeenCalledTimes(1);
    const [captured, ctx] = captureException.mock.calls[0];
    expect((captured as Error).message).toBe("downstream failure");
    expect(ctx).toMatchObject({
      tags: { module: "err-sentry", route: "/api/y" },
      extra: { route: "/api/y" },
    });
  });

  it("debug is a no-op in production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const log = createLogger("debug-mod");
      log.debug("hidden");
      expect(infoSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
