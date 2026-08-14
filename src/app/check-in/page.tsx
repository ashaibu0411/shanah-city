"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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
        description="Volunteers clock in at the church address. Parents check kids into children's ministry."
      />

      {loading ? (
        <Card>Loading account...</Card>
      ) : !user ? (
        <Card>
          <h2 className="font-display text-xl font-semibold text-night-900">
            Sign in to check in
          </h2>
          <p className="mt-2 text-sm text-night-600">
            Volunteer clock-in and kids check-in are available to signed-in members only.
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
          <div className="mb-6 flex gap-2">
            {([
              { id: "volunteer", label: "Volunteers" },
              { id: "kids", label: "Kids" },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  tab === item.id
                    ? "bg-night-900 text-sand-50"
                    : "bg-white text-night-600 ring-1 ring-night-900/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "volunteer" ? <VolunteerCheckInPanel /> : <KidsCheckInPanel />}
        </>
      )}
    </>
  );
}
