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

async function waitForBootLogo() {
  const img = document.querySelector<HTMLImageElement>("#native-boot-splash img");
  if (!img) return;

  if (img.complete && img.naturalWidth > 0) {
    await waitForPaint();
    return;
  }

  await new Promise<void>((resolve) => {
    const done = () => {
      void waitForPaint().then(resolve);
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
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

      await waitForBootLogo();

      try {
        await SplashScreen.hide({ fadeOutDuration: 0 });
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
