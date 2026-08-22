"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { USHER_SERVICE_TIMES } from "@/lib/frontliners-types";

export function GuestCaptureForm({ embedded = false }: { embedded?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [serviceTime, setServiceTime] = useState("10:00");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        visitDate,
        serviceTime,
        isFirstVisit,
        notes,
        website,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not submit your info. Please try again.");
      return;
    }

    setSubmitted(true);
    setMessage(data.message ?? "Thanks for connecting with us!");
    setName("");
    setEmail("");
    setPhone("");
    setVisitDate("");
    setNotes("");
  }

  const fieldClass =
    "mobile-field mt-1 block w-full rounded-xl border border-night-900/15 bg-sand-100 px-3 py-2.5 text-base text-night-900 outline-none ring-night-900/5 placeholder:text-night-400 focus:border-night-900/25 focus:bg-white focus:ring-2";

  if (submitted && message) {
    const success = (
      <div className={embedded ? "text-left" : "text-center"}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Welcome
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-night-900">{message}</h2>
        <p className="mt-3 text-sm text-night-600">
          Someone from our welcome team will be glad to meet you. No account needed.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => setSubmitted(false)}>
          Submit another guest
        </Button>
      </div>
    );
    return embedded ? success : <Card>{success}</Card>;
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm text-night-800">
          <span className="font-semibold">Your name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="First and last name"
            className={fieldClass}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-night-800">
            <span className="font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-night-800">
            <span className="font-semibold">Phone</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Best number to reach you"
              autoComplete="tel"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-night-800">
            <span className="font-semibold">Visit date (optional)</span>
            <input
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-night-800">
            <span className="font-semibold">Service time</span>
            <select
              value={serviceTime}
              onChange={(event) => setServiceTime(event.target.value)}
              className={fieldClass}
            >
              {USHER_SERVICE_TIMES.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-night-800">
          <input
            type="checkbox"
            checked={isFirstVisit}
            onChange={(event) => setIsFirstVisit(event.target.checked)}
            className="rounded border-night-900/20"
          />
          <span>This is my first visit to Shanah City</span>
        </label>

        <label className="block text-sm text-night-800">
          <span className="font-semibold">Notes or prayer request (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Anything you'd like us to know…"
            className={fieldClass}
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Sending…" : "Connect with us"}
        </Button>

        <p className="text-xs text-night-500">
          No account required. Email and phone help our welcome team follow up with you.
        </p>
      </form>
  );

  return embedded ? <div className="mt-4">{form}</div> : <Card>{form}</Card>;
}
