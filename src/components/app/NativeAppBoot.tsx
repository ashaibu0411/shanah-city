"use client";

import { useEffect } from "react";
import { isNativeAppPlatform } from "@/lib/native-app";

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function showBootSplash() {
  document.documentElement.classList.add("native-app-boot");
  document.body.dataset.native = "true";
}

function removeBootSplash() {
  document.documentElement.classList.remove("native-app-boot");
  document.getElementById("native-boot-splash")?.remove();
}

export function NativeAppBoot() {
  useEffect(() => {
    if (!isNativeAppPlatform()) return;

    showBootSplash();

    async function bootNativeShell() {
      const [{ SplashScreen }, { StatusBar, Style }, nativePush] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
        import("@/lib/native-push-client"),
      ]);

      await waitForPaint();

      try {
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }

      await waitForPaint();
      removeBootSplash();

      try {
        await nativePush.startNativePushListeners();
      } catch {
        // Native push needs Firebase (Android) and APNs (iOS) setup.
      }

      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#1a2332" });
      } catch {
        // Status bar plugin is iOS/Android only.
      }
    }

    void bootNativeShell();
  }, []);

  return null;
}
