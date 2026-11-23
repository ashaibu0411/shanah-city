"use client";

import { useEffect, useState } from "react";

type Activity = { id: string; kind: string; outcome: string; note: string | null; actorName: string; createdAt: string };

export function GuestContactHistory({ guestId, onConnected }: { guestId: string; onConnected?: () => void }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [kind, setKind] = useState("call");
  const [outcome, setOutcome] = useState("connected");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/follow-up/activities?guestId=" + encodeURIComponent(guestId));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load contact history.");
      setItems(data.activities ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load contact history.");
    }
  }

  useEffect(() => { if (open) void load(); }, [open, guestId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/follow-up/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, kind, outcome, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save contact.");
      setNote("");
      setMessage("Contact recorded.");
      await load();
      if (outcome === "connected") onConnected?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-night-900/10 pt-4">
      <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold text-blue-700 underline">
        {open ? "Hide contact history" : "Record contact / view history"}
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <form onSubmit={submit} className="space-y-3 rounded-xl bg-sand-100 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-night-900">Contact method
                <select value={kind} onChange={e => setKind(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2 text-night-900">
                  <option value="call">Phone call</option><option value="email">Email</option><option value="text">Text message</option><option value="visit">In person</option><option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-night-900">Outcome
                <select value={outcome} onChange={e => setOutcome(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2 text-night-900">
                  <option value="connected">Connected</option><option value="no_answer">No answer</option><option value="follow_up_needed">Follow-up needed</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-night-900">Notes (optional)
              <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1500} rows={3} placeholder="Brief ministry follow-up note. Avoid sensitive details." className="mt-1 w-full rounded-lg border bg-white p-3 text-night-900" />
            </label>
            <button type="submit" disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save contact"}</button>
          </form>
          {message && <p role="status" className="text-sm text-night-700">{message}</p>}
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-night-600">No contact activity recorded yet.</p>}
            {items.map(item => (
              <div key={item.id} className="rounded-lg border border-night-900/10 p-3 text-sm text-night-700">
                <p className="font-semibold">{item.kind} · {item.outcome.replaceAll("_", " ")}</p>
                <p>{item.actorName} · {new Date(item.createdAt).toLocaleString()}</p>
                {item.note && <p className="mt-1 whitespace-pre-wrap">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
