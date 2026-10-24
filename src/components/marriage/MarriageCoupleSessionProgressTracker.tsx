"use client";

import Link from "next/link";
import type { MarriageCouplePremaritalProgramView } from "@/lib/marriage-counseling-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

type Props = {
  program: MarriageCouplePremaritalProgramView;
};

function statusTone(status: string) {
  if (status === "completed") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100";
  if (status === "in_progress") return "bg-clay-100 text-clay-900 dark:bg-clay-900/40 dark:text-clay-100";
  return "bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-sand-200";
}

export function MarriageCoupleSessionProgressTracker({ program }: Props) {
  return (
    <section className={`${marriagePremium.card} mt-6`} aria-labelledby="eight-session-tracker">
      <h2 id="eight-session-tracker" className={marriagePremium.sectionLabel}>
        Eight-session journey
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
        {program.sessionsCompleted}/{program.sessionsTotal} sessions marked complete with your counselor. Assessment
        progress does not automatically complete a session.
      </p>
      <ul className="mt-4 space-y-3">
        {program.sessions.map((session) => (
          <li
            key={session.sessionKey}
            className="rounded-xl border border-stone-200 px-3 py-3 dark:border-white/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Session {session.order}: {session.title}
                </p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize ${statusTone(session.status)}`}>
                  {session.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            {session.appointment ? (
              <p className="mt-2 text-xs text-night-600 dark:text-sand-300">
                Appointment:{" "}
                {formatMarriageSessionScheduledAt(
                  session.appointment.scheduledAt,
                  session.appointment.schedulingTimeZone,
                )}
                {session.appointment.meetingMode
                  ? ` · ${session.appointment.meetingMode.replace(/_/g, " ")}`
                  : ""}
              </p>
            ) : null}
            {session.releasedHomework.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {session.releasedHomework.map((hw) => (
                  <li key={hw.homeworkId}>
                    <Link href={`/marriage/homework/${hw.homeworkId}`} className="font-semibold text-clay-800 underline dark:text-clay-300">
                      {hw.title}
                    </Link>
                    <span className="ml-1 capitalize text-night-500">· {hw.status.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {session.linkedModules.filter((m) => m.recommendedForSession).length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {session.linkedModules
                  .filter((m) => m.recommendedForSession)
                  .map((m) => (
                    <li key={m.moduleId}>
                      <Link href={`/marriage/module/${m.moduleId}`} className="font-semibold text-clay-800 underline dark:text-clay-300">
                        {m.title}
                      </Link>
                      <span className="ml-1 capitalize text-night-500">· you {m.myStatus.replace(/_/g, " ")}</span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
