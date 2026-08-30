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
  isNativeApp: boolean;
  moreMenuOpen: boolean;
  setMoreMenuOpen: (open: boolean) => void;
  messagesImmersive: boolean;
  setMessagesImmersive: (immersive: boolean) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const { isMobileApp, isNativeApp } = useAppShellMode();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [messagesImmersive, setMessagesImmersive] = useState(false);

  const value = useMemo(
    () => ({
      isMobileApp,
      isNativeApp,
      moreMenuOpen,
      setMoreMenuOpen,
      messagesImmersive,
      setMessagesImmersive,
    }),
    [isMobileApp, isNativeApp, moreMenuOpen, messagesImmersive],
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
