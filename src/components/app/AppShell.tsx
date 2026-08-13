import { AppProvider } from "@/components/app/AppProvider";

import { ReadabilityProvider } from "@/components/app/ReadabilityProvider";

import { AppShellProvider } from "@/components/app/AppShellContext";

import { AuthProvider } from "@/components/auth/AuthProvider";

import { AppSidebar } from "@/components/app/AppSidebar";

import { MobileAppHeader } from "@/components/app/MobileAppHeader";

import { MobileMoreSheet } from "@/components/app/MobileMoreSheet";

import { MobileNav } from "@/components/app/MobileNav";

import { TopBar } from "@/components/app/TopBar";



export function AppShell({ children }: { children: React.ReactNode }) {

  return (

    <AuthProvider>

      <AppProvider>

        <ReadabilityProvider>

        <AppShellProvider>

          <div className="min-h-screen bg-sand-50">

            <div className="hidden lg:block">

              <TopBar />

            </div>

            <MobileAppHeader />



            <div className="mx-auto flex max-w-7xl lg:mx-auto">

              <AppSidebar />

              <main className="app-main min-w-0 flex-1 px-4 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-6 lg:pb-8">

                {children}

              </main>

            </div>



            <MobileNav />

            <MobileMoreSheet />

          </div>

        </AppShellProvider>

        </ReadabilityProvider>

      </AppProvider>

    </AuthProvider>

  );

}


