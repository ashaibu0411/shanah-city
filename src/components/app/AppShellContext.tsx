"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppShellMode } from "@/hooks/useAppShellMode";

type AppShellContextValue = {
  isMobileApp: boolean;
  moreMenuOpen: boolean;
  setMoreMenuOpen: (open: boolean) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const isMobileApp = useAppShellMode();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      isMobileApp,
      moreMenuOpen,
      setMoreMenuOpen,
    }),
    [isMobileApp, moreMenuOpen],
  );

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return context;
}
