import { Suspense } from "react";
import { MessagesHub } from "@/components/messages/MessagesHub";
import { PageHeader } from "@/components/ui";

export default function MessagesPage() {
  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          eyebrow="Members"
          title="Messages"
          description="Private conversations between Shanah City members."
        />
      </div>
      <Suspense
        fallback={
          <div className="flex h-[calc(100dvh-5rem)] items-center justify-center rounded-2xl border border-night-900/8 bg-white">
            <p className="text-sm text-night-600">Loading messages…</p>
          </div>
        }
      >
        <MessagesHub />
      </Suspense>
    </>
  );
}
