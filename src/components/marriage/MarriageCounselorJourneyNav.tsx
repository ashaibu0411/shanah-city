"use client";

import Link from "next/link";

type Props = {
  journeyId: string;
  programType: string;
  showReadiness: boolean;
};

const linkClass =
  "rounded-full border border-[#E8E2DA] px-3 py-1.5 text-xs font-semibold text-[#292219] transition hover:border-clay-500 dark:border-white/10 dark:text-sand-100";

export function MarriageCounselorJourneyNav({ journeyId, programType, showReadiness }: Props) {
  const base = `/marriage/counselor/journey/${journeyId}`;
  const isPremarital = programType === "premarital";

  return (
    <nav
      className="marriage-c3m-journey-nav sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap gap-2 border-b border-[#E8E2DA] bg-[#F7F4EF]/95 pb-3 pt-1 backdrop-blur dark:border-white/10 dark:bg-[#1a1612]/95"
      aria-label="Couple journey sections"
    >
      <a href={`${base}#journey-overview`} className={linkClass}>
        Overview
      </a>
      {isPremarital ? (
        <a href={`${base}#premarital-program`} className={linkClass}>
          Eight-session program
        </a>
      ) : null}
      <Link href={`${base}/homework`} className={linkClass}>
        Homework
      </Link>
      {isPremarital ? (
        <>
          <a href={`${base}#premarital-ops-appointments`} className={linkClass}>
            Appointments
          </a>
          <a href={`${base}#premarital-ops-attendance`} className={linkClass}>
            Attendance
          </a>
        </>
      ) : (
        <a href={`${base}#journey-sessions`} className={linkClass}>
          Sessions
        </a>
      )}
      <a href={`${base}#journey-private-notes`} className={linkClass}>
        Private notes
      </a>
      {showReadiness ? (
        <a href={`${base}#premarital-ops-readiness`} className={linkClass}>
          Readiness review
        </a>
      ) : null}
    </nav>
  );
}
