import { Suspense } from "react";
import { MessagesHub } from "@/components/messages/MessagesHub";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-5rem)] items-center justify-center rounded-2xl border border-[#efefef] bg-white">
          <p className="text-sm text-[#8e8e8e]">Loading messages…</p>
        </div>
      }
    >
      <MessagesHub />
    </Suspense>
  );
}
