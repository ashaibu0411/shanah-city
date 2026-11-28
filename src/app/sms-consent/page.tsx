import type { Metadata } from "next";
import { SmsConsentForm } from "@/components/sms/SmsConsentForm";
import { SMS_CONSENT_DISCLOSURE_TEXT } from "@/lib/sms-consent-copy";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "SMS Consent & Text Message Opt-In",
  description:
    "Voluntary SMS opt-in form for Shanah City Church — services, events, announcements, and ministry updates. No account required.",
  alternates: { canonical: "https://shanahcity.org/sms-consent" },
  robots: { index: true, follow: true },
};

export default function SmsConsentPage() {
  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#10264a]">Shanah City · SMS program</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#17191c] sm:text-4xl">
          Subscribe to church text messages
        </h1>
        <p className="text-base leading-relaxed text-[#667085]">
          Use this public form to opt in to optional SMS updates from {site.name}. You do not need a church account
          or app installation. Consent is voluntary and is not required to attend services, join ministries, or
          give.
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-[#667085]">
        <h2 className="text-lg font-semibold text-[#17191c]">Web opt-in (this page)</h2>
        <p>
          Enter your name and US mobile number below. Check the SMS consent box only if you want recurring text
          messages. The checkbox is <strong>unchecked by default</strong>.
        </p>
        <p className="rounded-xl border border-[#e5dfd4] bg-white px-4 py-3 text-[#17191c]">{SMS_CONSENT_DISCLOSURE_TEXT}</p>
      </section>

      <SmsConsentForm />

      <section className="space-y-3 border-t border-[#e5dfd4] pt-8 text-sm leading-relaxed text-[#667085]">
        <h2 className="text-lg font-semibold text-[#17191c]">In-person opt-in (Sunday or guest visit)</h2>
        <p>
          During an in-person visit, a welcome team member may offer an optional connection card or tablet. SMS is
          collected only when you <strong>separately check an optional SMS box</strong> that uses the same disclosure
          language. Staff enter your choice only after you provide affirmative consent. You may visit without opting
          in to SMS.
        </p>
        <p>
          Paper cards are stored with the welcome team and transferred to the same consent audit system. Verbal
          consent alone is <strong>not</strong> used for this program.
        </p>
      </section>

      <section className="space-y-2 text-sm text-[#667085]">
        <h2 className="text-lg font-semibold text-[#17191c]">Opt out and help</h2>
        <p>
          Reply <strong>STOP</strong> to unsubscribe or <strong>HELP</strong> for assistance. After STOP, you may
          re-subscribe on this page with a new affirmative opt-in, or reply <strong>START</strong> where supported by
          your carrier.
        </p>
      </section>
    </main>
  );
}