"use client";

import * as React from "react";

type DrawerKey = "labels" | "hashtags" | "schedule" | null;

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
