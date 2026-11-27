"use client";

import { useEffect } from "react";
import { useAppShell } from "@/components/app/AppShellContext";

const FOCUSABLE =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"], [role="textbox"]';

/** Hides fixed bottom navigation while software keyboard is open on mobile shell. */
export function AppMobileKeyboardDock() {
  const { isMobileApp } = useAppShell();

  useEffect(() => {
    if (!isMobileApp || typeof document === "undefined") return;

    function syncKeyboardState() {
      const active = document.activeElement;
      const typing =
        active instanceof HTMLElement && Boolean(active.closest(FOCUSABLE));
      if (typing) {
        document.body.dataset.mobileKeyboardOpen = "true";
      } else {
        delete document.body.dataset.mobileKeyboardOpen;
      }
    }

    document.addEventListener("focusin", syncKeyboardState);
    document.addEventListener("focusout", syncKeyboardState);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncKeyboardState);
    }

    return () => {
      document.removeEventListener("focusin", syncKeyboardState);
      document.removeEventListener("focusout", syncKeyboardState);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", syncKeyboardState);
      }
      delete document.body.dataset.mobileKeyboardOpen;
    };
  }, [isMobileApp]);

  return null;
}