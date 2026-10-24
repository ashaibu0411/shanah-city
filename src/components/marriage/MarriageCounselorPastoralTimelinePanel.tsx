"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarriagePastoralTimelineEvent } from "@/lib/marriage-certificate-types";
import { readJsonResponse } from "@/lib/read-json-response";

const REPORT_KINDS = [
  ["progress", "Progress"],
  ["attendance", "Attendance"],
  ["homework", "Homework"],
  ["supplementary", "Supplementary"],
  ["outstanding", "Outstanding"],
  ["completion", "Completion"],
] as const;

type Props = {
  journeyId: string;
};

export function MarriageCounselorPastoralTimelinePanel({ journeyId }: Props) {
  const [events, setEvents] = useState<MarriagePastoralTimelineEvent[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(`/api/marriage/counselor/journey/${journeyId}/timeline`);
    const data = await readJsonResponse<{ events?: MarriagePastoralTimelineEvent[]; error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Could not load timeline.");
    else setEvents(data.events ?? []);
  }, [journeyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("marriage-timeline-refresh", onRefresh);
    return () => window.removeEventListener("marriage-timeline-refresh", onRefresh);
  }, [load]);

  return (
    <section className="mt-6 rounded-xl border border-stone-200 p-4 dark:border-white/10">
      <h3 className="text-sm font-semibold">Counseling timeline</h3>
      <p className="mt-1 text-xs text-night-500">Chronological pastoral record (private observations excluded from summaries).</p>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
      <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-lg bg-stone-50 px-3 py-2 dark:bg-white/5">
            <p className="text-xs text-night-500">{new Date(ev.at).toLocaleString()}</p>
            <p className="font-semibold">{ev.title}</p>
            <p className="text-xs">{ev.summary}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {REPORT_KINDS.map(([kind, label]) => (
          <a
            key={kind}
            href={`/api/marriage/counselor/journey/${journeyId}/reports?kind=${kind}`}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-bold dark:border-white/20"
          >
            {label} report
          </a>
        ))}
      </div>
    </section>
  );
}
