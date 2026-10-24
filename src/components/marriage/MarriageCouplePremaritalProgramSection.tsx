"use client";

import Link from "next/link";
import type { MarriageCouplePremaritalProgramView } from "@/lib/marriage-counseling-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

type Props = {
  program: MarriageCouplePremaritalProgramView;
};

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function MarriageCouplePremaritalProgramSection({ program }: Props) {
  const current =
    program.sessions.find((s) => s.sessionKey === program.currentSessionKey) ??
    program.sessions[0];

  if (!current) return null;

  return (
    <section className={`${marriagePremium.card} mt-6`} aria-labelledby="premarital-program-heading">
      <h2 id="premarital-program-heading" className="text-base font-semibold">
        Counseling sessions
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1`}>
        {program.sessionsCompleted}/{program.sessionsTotal} sessions completed with your counselor.
        {program.paused ? " Your journey is paused — your counselor will resume when ready." : ""}
      </p>

      <div className="mt-4 rounded-xl bg-clay-50/80 px-3 py-3 dark:bg-clay-950/30">
        <p className="text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-200">
          Current focus
        </p>
        <p className="mt-1 font-semibold">
          Session {current.order}: {current.title}
        </p>
        <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{current.purpose}</p>
        <p className="mt-2 text-xs capitalize text-night-600 dark:text-sand-400">
          Status: {statusLabel(current.status)}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">Assessments for this session</p>
        <ul className="mt-2 space-y-2">
          {current.linkedModules.map((mod) => (
            <li key={mod.moduleId} className={marriagePremium.moduleRow}>
              <Link href={`/marriage/module/${mod.moduleId}`} className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {mod.title}
                  {!mod.recommendedForSession ? " (optional)" : ""}
                </span>
                <span className="block text-xs text-night-500 dark:text-sand-400">
                  You: {statusLabel(mod.myStatus)}
                  {mod.partnerStatus !== "unknown"
                    ? ` · Partner: ${statusLabel(mod.partnerStatus)}`
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {current.releasedHomework.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">Released homework</p>
          <ul className="mt-2 space-y-2 text-sm">
            {current.releasedHomework.map((hw) => (
              <li key={hw.homeworkId}>
                <Link href={`/marriage/homework/${hw.homeworkId}`} className="font-semibold underline">
                  {hw.title}
                </Link>
                <span className="text-night-600 dark:text-sand-400">
                  {" "}
                  · {statusLabel(hw.status)}
                  {hw.dueAt ? ` · due ${new Date(hw.dueAt).toLocaleDateString()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/marriage/homework" className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
        View all homework
      </Link>
    </section>
  );
}
