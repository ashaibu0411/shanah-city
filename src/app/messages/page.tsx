import { Suspense } from "react";
import { MessagesHub } from "@/components/messages/MessagesHub";
import { Card, PageHeader } from "@/components/ui";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="Messages"
        description="Private conversations between Shanah City members. Sign in to connect with your church family."
      />
      <Suspense
        fallback={
          <Card>
            <p className="text-sm text-night-600">Loading messages...</p>
          </Card>
        }
      >
        <MessagesHub />
      </Suspense>
    </>
  );
}
