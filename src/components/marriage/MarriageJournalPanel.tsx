"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageJournalEntryRecord } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageJournalPanel() {
  const [entries, setEntries] = useState<MarriageJournalEntryRecord[]>([]);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/journal", { cache: "no-store" });
    const data = await readJsonResponse<{ entries: MarriageJournalEntryRecord[] }>(res);
    if (res.ok) setEntries(data.entries);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setError("");
    const res = await fetch("/api/marriage/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, visibility, kind: "reflection" }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setBody("");
    await load();
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Couple journal</h1>
      <p className={marriagePremium.cardMuted}>
        Shared notes are visible to both partners. Private notes stay on your account only.
      </p>

      <div className={`${marriagePremium.card} mt-6`}>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-xs font-semibold ${visibility === "shared" ? "bg-clay-600 text-white" : "bg-stone-100"}`}
            onClick={() => setVisibility("shared")}
          >
            Shared
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-xs font-semibold ${visibility === "private" ? "bg-night-900 text-white" : "bg-stone-100"}`}
            onClick={() => setVisibility("private")}
          >
            Private
          </button>
        </div>
        <textarea
          className="mt-3 min-h-[100px] w-full rounded-xl border border-night-900/10 px-3 py-3 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Reflection, next steps, or questions for your counselor"
        />
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <button type="button" className={`${marriagePremium.primaryCta} mt-3`} onClick={() => save()}>
          Save entry
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className={marriagePremium.card}>
            <p className="text-xs font-bold uppercase text-night-500">
              {entry.visibility} · {entry.authorName}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{entry.body}</p>
            <p className="mt-2 text-xs text-night-400">{new Date(entry.createdAt).toLocaleString()}</p>
          </li>
        ))}
        {entries.length === 0 && (
          <p className={marriagePremium.cardMuted}>No entries yet.</p>
        )}
      </ul>
    </div>
  );
}
