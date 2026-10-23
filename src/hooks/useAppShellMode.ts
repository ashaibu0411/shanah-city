"use client";

import { useEffect, useState } from "react";
import { isNativeAppPlatform } from "@/lib/native-app";

const MOBILE_QUERY = "(max-width: 1023px)";
const STANDALONE_QUERY = "(display-mode: standalone)";

function readMobileShellState() {
  if (typeof window === "undefined") return { mobile: false, native: false };
  const native = isNativeAppPlatform();
  const mobile =
    native ||
    window.matchMedia(MOBILE_QUERY).matches ||
    window.matchMedia(STANDALONE_QUERY).matches;
  return { mobile, native };
}

export function useAppShellMode() {
  const [isMobileApp, setIsMobileApp] = useState(() => readMobileShellState().mobile);
  const [isNativeApp, setIsNativeApp] = useState(() => readMobileShellState().native);

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    const standaloneMedia = window.matchMedia(STANDALONE_QUERY);

    function update() {
      const { mobile, native } = readMobileShellState();
      setIsNativeApp(native);
      setIsMobileApp(mobile);
      document.body.dataset.shell = mobile ? "mobile" : "website";
      if (native) {
        document.body.dataset.native = "true";
      } else {
        delete document.body.dataset.native;
      }
    }

    update();

    const nativePoll = window.setInterval(() => {
      if (!isNativeAppPlatform()) return;
      update();
      window.clearInterval(nativePoll);
    }, 50);
    window.setTimeout(() => window.clearInterval(nativePoll), 1000);

    mobileMedia.addEventListener("change", update);
    standaloneMedia.addEventListener("change", update);

    return () => {
      window.clearInterval(nativePoll);
      mobileMedia.removeEventListener("change", update);
      standaloneMedia.removeEventListener("change", update);
      delete document.body.dataset.shell;
    };
  }, []);

  return { isMobileApp, isNativeApp };
}
