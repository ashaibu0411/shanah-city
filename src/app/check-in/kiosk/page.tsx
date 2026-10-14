"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { KidsCheckInPanel } from "@/components/checkin/KidsCheckInPanel";
import { Button, Card, PageHeader } from "@/components/ui";

export default function KidsCheckInKioskPage() {
  const { user, loading } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Kids Ministry"
        title="Check-in station"
        description="Fixed tablet at the welcome desk — large buttons, automatic label printing, no public roster."
      />

      {loading ? (
        <Card>Loading account...</Card>
      ) : !user ? (
        <Card>
          <h2 className="font-display text-xl font-semibold text-night-900">Sign in to open the station</h2>
          <p className="mt-2 text-sm text-night-600">
            Use a church greeter account on this tablet. After sign-in, keep the device on this page (Guided Access
            on iPad recommended).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/sign-in?next=/check-in/kiosk" className="min-h-12 px-6 text-base">
              Sign in
            </Button>
          </div>
        </Card>
      ) : (
        <KidsCheckInPanel kiosk />
      )}
    </>
  );
}
