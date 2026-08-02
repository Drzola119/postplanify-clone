"use client";

import * as React from "react";

/**
 * Drawer key union. The provider does NOT render any panels itself —
 * it just tracks which key is active, and individual drawer panels
 * (e.g. LabelsDrawer, HashtagsDrawer, ScheduleDrawer, HistoryDrawer)
 * mount themselves in their parent route and conditionally render
 * based on `active === "their-key"`.
 *
 * Phase 2 added "history" so the Carousel Studio's revision timeline
 * can share the same drawer plumbing the rest of the dashboard uses.
 */
type DrawerKey = "labels" | "hashtags" | "schedule" | "history" | null;

interface DrawerContextValue {
  openDrawer: (key: Exclude<DrawerKey, null>) => void;
  closeDrawer: () => void;
  active: DrawerKey;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState<DrawerKey>(null);

  const openDrawer = React.useCallback((key: Exclude<DrawerKey, null>) => {
    setActive(key);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setActive(null);
  }, []);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, active }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) {
    return {
      openDrawer: () => {},
      closeDrawer: () => {},
      active: null as DrawerKey,
    };
  }
  return ctx;
}
