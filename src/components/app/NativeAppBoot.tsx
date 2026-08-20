"use client";

import { useEffect } from "react";
import { isNativeAppPlatform } from "@/lib/native-app";

export function NativeAppBoot() {
  useEffect(() => {
    if (!isNativeAppPlatform()) return;

    async function bootNativeShell() {
      const [{ SplashScreen }, { StatusBar, Style }, nativePush] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
        import("@/lib/native-push-client"),
      ]);

      document.body.dataset.native = "true";

      try {
        await nativePush.startNativePushListeners();
        if (!nativePush.isNativePushOptedOut()) {
          await nativePush.registerNativePush();
        }
      } catch {
        // Native push needs Firebase (Android) and APNs (iOS) setup.
      }

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
