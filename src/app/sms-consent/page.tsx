import Link from "next/link";
import type { Metadata } from "next";
import { GuestCaptureForm } from "@/components/guest/GuestCaptureForm";

export const metadata: Metadata = {
  title: "SMS Consent | Shanah City",
  description: "Voluntary text-message opt-in for Shanah City church updates, services, events and guest follow-up.",
};

export default function SmsConsentPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-night-900">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Shanah City · Communications</p>
        <h1 className="text-3xl font-bold">SMS Consent &amp; Church Updates</h1>
        <p className="text-night-700">Choose whether you want to receive text messages from Shanah City. This is optional; you can connect with our church without agreeing to texts.</p>
      </header>
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-relaxed text-night-800">
        <h2 className="text-lg font-bold">How SMS consent works</h2>
        <p className="mt-2">Enter your contact information in the form below. Under “How can Shanah City connect with you?”, the <strong>Optional SMS updates</strong> checkbox is unchecked by default. Check it only if you wish to receive recurring messages about services, events, announcements and guest follow-up.</p>
        <p className="mt-2"><strong>Message frequency varies. Message and data rates may apply.</strong> Reply <strong>STOP</strong> to unsubscribe or <strong>HELP</strong> for help. Consent is not a condition of church attendance, participation or donations.</p>
        <p className="mt-2">Review our <Link className="font-semibold underline" href="/privacy">Privacy Policy</Link> and <Link className="font-semibold underline" href="/terms">Terms &amp; Conditions</Link>.</p>
      </section>
      <section aria-label="SMS opt-in and guest registration form">
        <h2 className="mb-3 text-xl font-bold">Your contact information and optional SMS consent</h2>
        <GuestCaptureForm />
      </section>
    </main>
  );
}
