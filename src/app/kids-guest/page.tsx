"use client";

import { useState } from "react";

export default function KidsGuestRegistrationPage() {
  const [guardian, setGuardian] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guardian,
          phone,
          email,
          isFirstVisit: true,
          notes: "Kids Ministry guest family requested in-person registration. No child details collected online.",
          website,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setStatus("Thank you! Please visit the Shanah Kids desk. A teacher must verify your details and complete your child's check-in. No pickup code has been issued yet.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit. Please visit the Kids Ministry desk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Shanah City</p>
      <h1 className="text-3xl font-bold">Shanah Kids · Guest arrival</h1>
      <p className="text-slate-600 dark:text-slate-300">No app or account needed. Tell us you're here, then visit the Kids Ministry desk for a secure, teacher-approved check-in.</p>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border p-5">
        <label className="block text-sm font-semibold">Parent or guardian name
          <input required minLength={2} maxLength={100} value={guardian} onChange={e => setGuardian(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-base text-slate-900" autoComplete="name" />
        </label>
        <label className="block text-sm font-semibold">Phone
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-base text-slate-900" autoComplete="tel" />
        </label>
        <label className="block text-sm font-semibold">Email
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-base text-slate-900" autoComplete="email" />
        </label>
        <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label></div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
          <span>I agree to share my contact details with Shanah City's guest and Follow-Up Ministry team. Child safety and pickup information will be collected privately by a teacher.</span>
        </label>
        <button disabled={busy || !consent} className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Notify the welcome team"}</button>
        {status && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm text-slate-900">{status}</p>}
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-300">Submitting this form does not check a child in or authorize pickup. The Kids Ministry teacher completes those steps in person.</p>
    </main>
  );
}
