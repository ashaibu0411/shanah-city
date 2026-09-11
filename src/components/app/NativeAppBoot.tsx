"use client";

import { useEffect, useState } from "react";
import { NativeSplashOverlay } from "@/components/app/NativeSplashOverlay";
import { isNativeAppPlatform } from "@/lib/native-app";

type SplashPhase = "enter" | "exit" | "hidden";

const SPLASH_HOLD_MS = 900;
const SPLASH_EXIT_MS = 420;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function NativeAppBoot() {
  const [splashPhase, setSplashPhase] = useState<SplashPhase>(() =>
    typeof window !== "undefined" && isNativeAppPlatform() ? "enter" : "hidden",
  );

  useEffect(() => {
    if (!isNativeAppPlatform()) return;

    let cancelled = false;

    async function bootNativeShell() {
      const [{ SplashScreen }, { StatusBar, Style }, nativePush] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
        import("@/lib/native-push-client"),
      ]);

      document.body.dataset.native = "true";

      try {
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }

      await wait(SPLASH_HOLD_MS);
      if (cancelled) return;

      setSplashPhase("exit");
      await wait(SPLASH_EXIT_MS);
      if (cancelled) return;

      setSplashPhase("hidden");

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

    return () => {
      cancelled = true;
    };
  }, []);

  return <NativeSplashOverlay phase={splashPhase} />;
}
