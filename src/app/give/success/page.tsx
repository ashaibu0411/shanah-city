import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { GiveSuccessClient } from "@/components/give/GiveSuccessClient";

export default function GiveSuccessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Thank you"
        description="Your gift helps Shanah City proclaim the gospel and serve our community."
      />
      <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
        <p className="text-night-700">
          Your payment was submitted successfully. Signed-in gifts sync to{" "}
          <strong>Profile → Your giving</strong> automatically (webhook and return confirmation).
        </p>
        <p className="mt-3 text-sm text-night-600">
          For <strong>recurring</strong> gifts: open Profile → Your giving and tap{" "}
          <strong>Manage or cancel in Stripe</strong> to change amount, card, or cancel.
        </p>
        <Suspense fallback={<p className="mt-4 text-sm text-night-500">Loading…</p>}>
          <GiveSuccessClient />
        </Suspense>
      </div>
    </>
  );
}
