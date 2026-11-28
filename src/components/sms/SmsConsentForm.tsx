"use client";

import Link from "next/link";
import { useState } from "react";
import { SMS_CONSENT_DISCLOSURE_TEXT } from "@/lib/sms-consent-copy";

export function SmsConsentForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/sms-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, consent, website }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save your consent. Please try again.");
      return;
    }

    setSuccess(data.message ?? "Thank you. Your SMS consent has been recorded.");
    setName("");
    setPhone("");
    setConsent(false);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-night-900">
        <p className="text-lg font-semibold">{success}</p>
        <p className="mt-2 text-sm text-night-700">
          You can unsubscribe at any time by replying <strong>STOP</strong>. Reply <strong>HELP</strong> for
          assistance.
        </p>
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-[#10264a] underline"
          onClick={() => setSuccess(null)}
        >
          Submit another number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#e5dfd4] bg-white p-6 shadow-sm">
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div>
        <label htmlFor="sms-name" className="block text-sm font-semibold text-night-900">
          Full name
        </label>
        <input
          id="sms-name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-night-900/15 px-3 py-2.5 text-base outline-none focus:border-[#10264a] focus:ring-2 focus:ring-[#10264a]/15"
        />
      </div>

      <div>
        <label htmlFor="sms-phone" className="block text-sm font-semibold text-night-900">
          Mobile phone number
        </label>
        <input
          id="sms-phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(555) 555-5555"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-night-900/15 px-3 py-2.5 text-base outline-none focus:border-[#10264a] focus:ring-2 focus:ring-[#10264a]/15"
        />
      </div>

      <div className="rounded-xl border border-[#dbe4ef] bg-[#f8f7f4] p-4">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-night-800">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>{SMS_CONSENT_DISCLOSURE_TEXT}</span>
        </label>
        <p className="mt-3 pl-7 text-xs text-night-600">
          <Link href="/privacy" className="font-semibold underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="font-semibold underline">
            Terms &amp; Conditions
          </Link>
        </p>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || !consent}
        className="min-h-11 w-full rounded-full bg-[#10264a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#091628] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Saving…" : "Subscribe to SMS updates"}
      </button>

      <p className="text-xs text-night-500">
        Leave the checkbox unchecked if you do not want text messages. Submitting your name and phone alone does
        not enroll you in SMS.
      </p>
    </form>
  );
}