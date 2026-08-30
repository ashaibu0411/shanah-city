"use client";

import { useEffect, useState } from "react";
import { isNativeAppPlatform } from "@/lib/native-app";

const MOBILE_QUERY = "(max-width: 1023px)";
const STANDALONE_QUERY = "(display-mode: standalone)";

export function useAppShellMode() {
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    const standaloneMedia = window.matchMedia(STANDALONE_QUERY);

    function update() {
      const native = isNativeAppPlatform();
      const mobile = native || mobileMedia.matches || standaloneMedia.matches;
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

    // Capacitor bridge can attach slightly after first paint on iOS.
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
