"use client";

import { useState } from "react";

const categories = [
  ["announcement", "Church announcement"],
  ["event_reminder", "Event reminder"],
  ["visitor_followup", "Visitor follow-up"],
  ["kids_checkin", "Kids check-in"],
  ["kids_checkout", "Kids checkout"],
  ["kids_contact", "Kids Ministry contact request"],
] as const;

type Preview = { body: string; phone: string; eligible: boolean; deliveryStatus: string; notice: string; purpose: string };

export default function SmsNotificationsWorkspace() {
  const [kind, setKind] = useState<string>("announcement");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const kids = kind.startsWith("kids_");

  async function prepare(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setPreview(null);
    try {
      const response = await fetch("/api/admin/sms-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, phone, title, detail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Preview failed");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally { setLoading(false); }
  }

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-night-900">
    <header className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Shanah City · Administration</p>
      <h1 className="text-3xl font-bold">Shanah City Notifications</h1>
      <p className="text-night-700">Prepare and review SMS messages before launch. This workspace cannot send texts.</p>
    </header>
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>SMS sending is locked.</strong> Twilio A2P campaign approval, production credentials, delivery logging, and end-to-end testing are required before activation.
    </section>
    <form onSubmit={prepare} className="space-y-4 rounded-2xl border border-night-900/15 bg-white p-5">
      <label className="block space-y-1 text-sm font-semibold">Notification type
        <select className="w-full rounded-lg border p-3" value={kind} onChange={e => { setKind(e.target.value); setPreview(null); }}>
          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-sm font-semibold">Recipient mobile number
        <input required type="tel" autoComplete="off" placeholder="(720) 555-0123" className="w-full rounded-lg border p-3" value={phone} onChange={e => setPhone(e.target.value)} />
      </label>
      {!kids && <>
        <label className="block space-y-1 text-sm font-semibold">Subject
          <input required maxLength={70} className="w-full rounded-lg border p-3" value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm font-semibold">Message
          <textarea required maxLength={240} rows={4} className="w-full rounded-lg border p-3" value={detail} onChange={e => setDetail(e.target.value)} />
        </label>
      </>}
      {kids && <p className="rounded-lg bg-blue-50 p-3 text-sm">Kids Ministry messages use fixed, privacy-safe templates. Child names, allergies, incident details and pickup codes are never included.</p>}
      <button disabled={loading} type="submit" className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Preparing…" : "Preview & check consent"}</button>
    </form>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {preview && <section className="space-y-3 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Message preview</h2>
      <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-sm">{preview.body}</p>
      <p className="text-sm">Recipient: {preview.phone} · Purpose: {preview.purpose}</p>
      <p className="text-sm font-semibold">{preview.eligible ? "Consent and configuration check passed; sending remains disabled." : "Not eligible to send: consent, opt-out state, or sending configuration requires attention."}</p>
      <p className="text-sm">{preview.notice}</p>
    </section>}
  </main>;
}
