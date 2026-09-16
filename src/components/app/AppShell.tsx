import { AppProvider } from "@/components/app/AppProvider";

import { ReadabilityProvider } from "@/components/app/ReadabilityProvider";
import { ThemeProvider } from "@/components/app/ThemeProvider";

import { AppShellProvider } from "@/components/app/AppShellContext";

import { AuthProvider } from "@/components/auth/AuthProvider";

import { AppSidebar } from "@/components/app/AppSidebar";

import { MobileAppHeader } from "@/components/app/MobileAppHeader";

import { MobileMoreSheet } from "@/components/app/MobileMoreSheet";

import { MobileNav } from "@/components/app/MobileNav";

import { AppMain } from "@/components/app/AppMain";
import { AppRefreshBridge } from "@/components/app/AppRefreshBridge";
import { NativeAppBoot } from "@/components/app/NativeAppBoot";
import { DevotionMiniPlayer } from "@/components/devotions/DevotionMiniPlayer";
import { DevotionPlayerProvider } from "@/components/devotions/DevotionPlayerProvider";
import { TopBar } from "@/components/app/TopBar";



export function AppShell({ children }: { children: React.ReactNode }) {

  return (

    <AuthProvider>

      <AppProvider>

        <ThemeProvider>
        <ReadabilityProvider>

        <AppShellProvider>
          <DevotionPlayerProvider>

          <NativeAppBoot />
          <AppRefreshBridge />

          <div className="min-h-screen bg-[var(--color-bg)]">

            <div className="app-desktop-topbar hidden lg:block">

              <TopBar />

            </div>

            <MobileAppHeader />



            <div className="app-shell-layout mx-auto flex max-w-7xl lg:mx-auto">

              <AppSidebar />

              <AppMain>{children}</AppMain>

            </div>



            <DevotionMiniPlayer />
            <MobileNav />

            <MobileMoreSheet />

          </div>

          </DevotionPlayerProvider>
        </AppShellProvider>

        </ReadabilityProvider>
        </ThemeProvider>

      </AppProvider>

    </AuthProvider>

  );

}


