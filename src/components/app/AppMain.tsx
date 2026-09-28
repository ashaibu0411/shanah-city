"use client";

import { Suspense } from "react";
import { PullToRefresh } from "@/components/app/PullToRefresh";
import { AppPageBackNav } from "@/components/app/AppPageBackNav";

export function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <PullToRefresh>
      <main className="app-main min-w-0 flex-1 px-4 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-6 lg:pb-8">
        <Suspense fallback={null}>
          <AppPageBackNav />
        </Suspense>
        {children}
      </main>
    </PullToRefresh>
  );
}
