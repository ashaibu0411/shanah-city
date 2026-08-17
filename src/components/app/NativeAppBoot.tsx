"use client";

import { useEffect } from "react";
import { isNativeAppPlatform } from "@/lib/native-app";

export function NativeAppBoot() {
  useEffect(() => {
    if (!isNativeAppPlatform()) return;

    async function bootNativeShell() {
      const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
      ]);

      document.body.dataset.native = "true";

      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#1a2332" });
      } catch {
        // Status bar plugin is iOS/Android only.
      }

      try {
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }
    }

    void bootNativeShell();
  }, []);

  return null;
}
