"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  rehearsalDateTimeLabel,
  serviceDateTimeLabel,
  worshipRoleLabel,
  worshipSegmentLabel,
  type WorshipServicePlan,
} from "@/lib/worship-types";

type WorshipRunSheetViewProps = {
  plan: WorshipServicePlan;
  autoPrint?: boolean;
};

export function WorshipRunSheetView({ plan, autoPrint = false }: WorshipRunSheetViewProps) {
  useEffect(() => {
    if (autoPrint) {
      window.print();
    }
  }, [autoPrint]);

  return (
    <div className="worship-run-sheet mx-auto max-w-3xl">
      <div className="print-hidden mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-sand-50"
        >
          Print run sheet
        </button>
        <Link
          href={`/worship?date=${encodeURIComponent(plan.serviceDate)}&time=${encodeURIComponent(plan.serviceTime)}`}
          className="text-sm font-semibold text-night-700 underline"
        >
          Back to planner
        </Link>
      </div>

      <article className="rounded-2xl bg-white p-8 ring-1 ring-night-900/10 print:rounded-none print:p-0 print:ring-0">
        <header className="border-b border-night-900/10 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night-500">
            Shanah City Worship · Run sheet
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-night-900">
            {plan.title?.trim() || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime)}
          </h1>
          <p className="mt-2 text-sm text-night-600">
            {serviceDateTimeLabel(plan.serviceDate, plan.serviceTime)}
            {plan.rehearsalDate
              ? ` · Rehearsal ${rehearsalDateTimeLabel(plan.rehearsalDate, plan.rehearsalTime)}`
              : ""}
          </p>
        </header>

        {plan.songs.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-night-500">Setlist</h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-night-900/10 text-left text-xs uppercase tracking-wide text-night-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Song</th>
                  <th className="py-2 pr-3">Segment</th>
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2 pr-3">BPM</th>
                  <th className="py-2">Leader</th>
                </tr>
              </thead>
              <tbody>
                {plan.songs.map((song, index) => (
                  <tr key={song.id} className="border-b border-night-900/5">
                    <td className="py-2.5 pr-3 font-semibold text-night-900">{index + 1}</td>
                    <td className="py-2.5 pr-3 font-semibold text-night-900">
                      {song.title}
                      {song.notes ? (
                        <span className="mt-0.5 block text-xs font-normal text-night-500">
                          {song.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-night-700">
                      {worshipSegmentLabel(song.segment ?? "worship")}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-night-900">{song.key}</td>
                    <td className="py-2.5 pr-3 text-night-700">{song.bpm ?? "—"}</td>
                    <td className="py-2.5 text-night-700">{song.leaderName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <p className="mt-6 text-sm text-night-500">No songs on this plan yet.</p>
        )}

        {plan.team.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-night-500">Team</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {plan.team.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2 text-sm print:bg-transparent print:px-0"
                >
                  <span className="font-semibold text-night-900">{member.name}</span>
                  <span className="text-night-600">{worshipRoleLabel(member.role)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan.rehearsalNotes?.trim() && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-night-500">
              Rehearsal notes
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-night-700">
              {plan.rehearsalNotes}
            </p>
          </section>
        )}

        <footer className="mt-8 border-t border-night-900/10 pt-4 text-xs text-night-500 print:mt-6">
          Generated {new Date().toLocaleString()} · {plan.status === "published" ? "Published" : "Draft"}
        </footer>
      </article>
    </div>
  );
}
