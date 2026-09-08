"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MobileTabPills } from "@/components/app/MobileTabPills";
import { KidsCheckInPanel } from "@/components/checkin/KidsCheckInPanel";
import { VolunteerCheckInPanel } from "@/components/checkin/VolunteerCheckInPanel";
import { Button, Card, PageHeader } from "@/components/ui";

export default function CheckInPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"volunteer" | "kids">("volunteer");

  return (
    <>
      <PageHeader
        eyebrow="Serve & family"
        title="Check-in"
        description="FrontLiners report their Sunday arrival time. Parents check kids into children's ministry."
      />

      {loading ? (
        <Card>Loading account...</Card>
      ) : !user ? (
        <Card>
          <h2 className="font-display text-xl font-semibold text-night-900">
            Sign in to check in
          </h2>
          <p className="mt-2 text-sm text-night-600">
            Sunday arrival and kids check-in are available to signed-in members only.
          </p>
          <div className="mt-4 flex gap-3">
            <Button href="/sign-in?next=/check-in">Sign in</Button>
            <Button href="/sign-up?next=/check-in" variant="secondary">
              Create account
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <MobileTabPills
            className="mb-6"
            tabs={[
              { id: "volunteer", label: "FrontLiners" },
              { id: "kids", label: "Kids" },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as "volunteer" | "kids")}
          />

          {tab === "volunteer" ? <VolunteerCheckInPanel /> : <KidsCheckInPanel />}
        </>
      )}
    </>
  );
}
