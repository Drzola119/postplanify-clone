"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import type { AppearancePreference, ThemePreference } from "@/lib/theme/types";
import { DEFAULT_THEME, isThemePreference } from "@/lib/theme/types";

const LOCAL_KEY = "postplanify-theme";
const DIRTY_KEY = "postplanify-theme-dirty";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark" | undefined;
  setTheme: (theme: ThemePreference) => void;
  ready: boolean;
  enabled: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function usePostPlanifyTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("usePostPlanifyTheme must be used within ThemeProvider");
  return context;
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const auth = useAuth();
  const pathname = usePathname() ?? "/";
  const [ready, setReady] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);
  const syncInFlight = React.useRef(false);
  const themeBeforeFlag = React.useRef<ThemePreference | null>(null);

  const persist = React.useCallback(async (next: ThemePreference) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCAL_KEY, next);
    window.localStorage.setItem(DIRTY_KEY, JSON.stringify({ theme: next, at: Date.now() }));
    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      if (response.ok) window.localStorage.removeItem(DIRTY_KEY);
    } catch {
      // Keep the dirty marker so the next authenticated sync retries the write.
    }
  }, []);

  const updateTheme = React.useCallback(
    (next: ThemePreference) => {
      setTheme(next);
      void persist(next);
    },
    [persist, setTheme]
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LOCAL_KEY);
    if (isThemePreference(saved)) setTheme(saved);
  }, [setTheme]);

  React.useEffect(() => {
    if (typeof window === "undefined" || syncInFlight.current) return;
    if (auth.status !== "authenticated") {
      setReady(true);
      return;
    }

    syncInFlight.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/settings/appearance", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as { appearance?: AppearancePreference | null };
        const dirty = window.localStorage.getItem(DIRTY_KEY);
        const local = window.localStorage.getItem(LOCAL_KEY);
        if (dirty && isThemePreference(local)) {
          await persist(local);
        } else if (body.appearance && isThemePreference(body.appearance.theme)) {
          window.localStorage.setItem(LOCAL_KEY, body.appearance.theme);
          setTheme(body.appearance.theme);
        }
      } finally {
        syncInFlight.current = false;
        setReady(true);
      }
    })();
  }, [auth.status, persist, setTheme]);

  React.useEffect(() => {
    const surface = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/dashboard") ? "product" : "public";
    let cancelled = false;
    void fetch(`/api/features/theme?surface=${surface}`, { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((body: { enabled?: boolean } | null) => {
        if (cancelled || typeof body?.enabled !== "boolean") return;
        setEnabled(body.enabled);
        if (!body.enabled) {
          const saved = window.localStorage.getItem(LOCAL_KEY);
          themeBeforeFlag.current = isThemePreference(saved) ? saved : DEFAULT_THEME;
          window.localStorage.setItem(LOCAL_KEY, "light");
          setTheme("light");
        } else if (themeBeforeFlag.current) {
          const restore = themeBeforeFlag.current;
          themeBeforeFlag.current = null;
          window.localStorage.setItem(LOCAL_KEY, restore);
          setTheme(restore);
        }
      })
      .catch(() => setEnabled(true));
    return () => { cancelled = true; };
  }, [pathname, setTheme]);

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_KEY && isThemePreference(event.newValue)) setTheme(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme: isThemePreference(theme) ? theme : DEFAULT_THEME,
      resolvedTheme: resolvedTheme === "light" || resolvedTheme === "dark" ? resolvedTheme : undefined,
      setTheme: updateTheme,
      ready,
      enabled,
    }),
    [enabled, ready, resolvedTheme, theme, updateTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      enableSystem
      enableColorScheme
      storageKey={LOCAL_KEY}
      disableTransitionOnChange={false}
    >
      <ThemeSync>{children}</ThemeSync>
    </NextThemesProvider>
  );
}
