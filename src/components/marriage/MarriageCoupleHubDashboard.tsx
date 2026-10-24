"use client";

import Link from "next/link";
import type { MarriageHubSummary } from "@/lib/marriage-counseling-types";
import { MarriageCoupleOnboardingSteps } from "@/components/marriage/MarriageCoupleOnboardingSteps";
import { MarriageCoupleSessionProgressTracker } from "@/components/marriage/MarriageCoupleSessionProgressTracker";
import { MarriageCoupleHelpSection } from "@/components/marriage/MarriageCoupleHelpSection";
import { MarriageCoupleCertificatesSection } from "@/components/marriage/MarriageCoupleCertificatesSection";
import { MarriageCouplePremaritalProgramSection } from "@/components/marriage/MarriageCouplePremaritalProgramSection";
import { MarriageCoupleProgramCompletionBanner } from "@/components/marriage/MarriageCoupleProgramCompletionBanner";
import { MarriagePrepNotificationCenter } from "@/components/marriage/MarriagePrepNotificationCenter";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

type Props = {
  hub: MarriageHubSummary;
  continueModuleHref: string | null;
};

function homeworkNeedsAttention(hub: MarriageHubSummary) {
  return (hub.sessionHomework ?? []).filter((h) => !h.submitted && h.status !== "not_started");
}

function modulesNeedingWork(hub: MarriageHubSummary) {
  return hub.modules.filter((m) => m.myStatus !== "submitted");
}

export function MarriageCoupleHubDashboard({ hub, continueModuleHref }: Props) {
  const attentionHomework = homeworkNeedsAttention(hub);
  const nextUpcoming = hub.upcomingSessions[0];
  const pendingModules = modulesNeedingWork(hub);
  const feedbackHomework = (hub.sessionHomework ?? []).filter((h) => h.hasCounselorFeedback);
  const showProgramHomeworkList = Boolean(
    hub.premaritalProgram && hub.premaritalProgram.allReleasedHomework.length > 0,
  );
  const showStandaloneHomeworkCard = (hub.sessionHomework?.length ?? 0) > 0 && !showProgramHomeworkList;

  return (
    <>
      {hub.coupleOnboarding ? <MarriageCoupleOnboardingSteps onboarding={hub.coupleOnboarding} /> : null}

      <div className={`${marriagePremium.card} mt-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={marriagePremium.sectionLabel}>Your journey</p>
            {hub.premaritalProgram ? (
              <p className="mt-1 font-display text-lg font-semibold">
                Session {hub.premaritalProgram.sessionsCompleted} of {hub.premaritalProgram.sessionsTotal} complete
              </p>
            ) : (
              <p className="mt-1 font-display text-lg font-semibold capitalize">
                {hub.programType?.replace(/_/g, " ") ?? "Marriage Prep"}
              </p>
            )}
            {hub.partnerName ? (
              <p className={`${marriagePremium.cardMuted} mt-1`}>Preparing with {hub.partnerName}</p>
            ) : null}
          </div>
          <MarriagePrepNotificationCenter initialUnreadCount={hub.prepNotificationUnreadCount ?? 0} />
        </div>

        {!hub.partnerJoined && hub.pendingInviteCode ? (
          <div className="mt-3 rounded-xl bg-clay-50 px-3 py-2 dark:bg-clay-950/40">
            <p className="text-xs font-bold uppercase text-clay-800 dark:text-clay-200">Partner invite code</p>
            <p className="font-mono text-lg font-bold tracking-widest break-all">{hub.pendingInviteCode}</p>
            <p className={`${marriagePremium.cardMuted} mt-1 text-xs`}>Share privately; expires in 14 days.</p>
          </div>
        ) : null}
        {hub.partnerJoined && !hub.partnerConsent ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Waiting for your partner to accept consent on their device.
          </p>
        ) : null}
        {hub.premaritalProgram?.paused ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Your counseling journey is paused. Your counselor will resume when ready.
          </p>
        ) : null}
        {hub.counselorSummary?.status === "assigned" && hub.counselorSummary.displayName ? (
          <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
            Counselor: {hub.counselorSummary.displayName}
          </p>
        ) : null}
      </div>

      <div className={`${marriagePremium.card} mt-4 border border-clay-200 dark:border-clay-800`}>
        <p className={marriagePremium.sectionLabel}>What to do next</p>
        <ul className="mt-2 space-y-2 text-sm">
          {nextUpcoming ? (
            <li>
              <span className="font-semibold">Next appointment: </span>
              {nextUpcoming.premaritalSessionTitle ?? nextUpcoming.topic ?? "Counseling session"} —{" "}
              {formatMarriageSessionScheduledAt(nextUpcoming.scheduledAt, nextUpcoming.schedulingTimeZone)}
            </li>
          ) : (
            <li className={marriagePremium.cardMuted}>No upcoming appointments scheduled.</li>
          )}
          {continueModuleHref && pendingModules.length > 0 ? (
            <li>
              <Link href={continueModuleHref} className="font-semibold text-clay-800 underline dark:text-clay-300">
                Continue your assessment
              </Link>
            </li>
          ) : null}
          {attentionHomework.slice(0, 3).map((hw) => (
            <li key={hw.id}>
              <Link href={`/marriage/homework/${hw.id}`} className="font-semibold text-clay-800 underline dark:text-clay-300">
                Homework: {hw.title}
              </Link>
              {hw.dueAt ? (
                <span className="ml-1 text-xs text-night-500">
                  (due {formatMarriageSessionScheduledAt(hw.dueAt, hw.dueAtTimeZone)})
                </span>
              ) : null}
            </li>
          ))}
          {feedbackHomework.length > 0 ? (
            <li>
              <Link href="/marriage/homework" className="font-semibold text-clay-800 underline dark:text-clay-300">
                View counselor feedback on submitted homework
              </Link>
            </li>
          ) : null}
          {(hub.prepNotificationUnreadCount ?? 0) > 0 ? (
            <li className="text-clay-800 dark:text-clay-200">
              You have {hub.prepNotificationUnreadCount} unread Marriage Prep update
              {hub.prepNotificationUnreadCount === 1 ? "" : "s"} — open Updates above.
            </li>
          ) : null}
        </ul>
      </div>

      {nextUpcoming ? (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className={marriagePremium.sectionLabel}>Next appointment details</p>
          <p className="mt-1 font-semibold">
            {nextUpcoming.premaritalSessionTitle ?? nextUpcoming.topic ?? "Counseling session"}
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatMarriageSessionScheduledAt(nextUpcoming.scheduledAt, nextUpcoming.schedulingTimeZone)}
            {nextUpcoming.scheduledEndAt
              ? ` – ${formatMarriageSessionScheduledAt(nextUpcoming.scheduledEndAt, nextUpcoming.schedulingTimeZone)}`
              : ""}
          </p>
          {nextUpcoming.meetingMode ? (
            <p className="mt-1 text-xs capitalize text-night-500">{nextUpcoming.meetingMode.replace(/_/g, " ")}</p>
          ) : null}
          {nextUpcoming.locationOrLink ? (
            nextUpcoming.meetingMode === "video" || nextUpcoming.locationOrLink.startsWith("http") ? (
              <a
                href={nextUpcoming.locationOrLink}
                className="mt-2 inline-block min-h-[44px] text-sm font-semibold text-clay-700 underline dark:text-clay-300"
                target="_blank"
                rel="noreferrer"
              >
                Open meeting link
              </a>
            ) : (
              <p className="mt-2 text-sm">{nextUpcoming.locationOrLink}</p>
            )
          ) : null}
          <p className={`${marriagePremium.cardMuted} mt-3 text-xs`}>
            To reschedule or cancel, contact your counselor. Appointment changes are made by your assigned counselor.
          </p>
        </div>
      ) : null}

      {(hub.premaritalAppointmentNotices?.length ?? 0) > 0 && (
        <div className={`${marriagePremium.card} mt-4 border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20`}>
          <p className={marriagePremium.sectionLabel}>Appointment updates</p>
          <ul className="mt-2 space-y-2 text-sm">
            {hub.premaritalAppointmentNotices!.map((n, i) => (
              <li key={i}>
                <p className="font-semibold">{n.sessionTitle}</p>
                <p className="text-xs text-night-600 dark:text-sand-400">{n.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showStandaloneHomeworkCard ? (
        <div className={`${marriagePremium.card} mt-4 min-w-0`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={marriagePremium.sectionLabel}>My homework</p>
            <Link href="/marriage/homework" className="min-h-[44px] text-xs font-bold text-clay-700 underline dark:text-clay-300">
              View all
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {hub.sessionHomework!.map((item) => (
              <li key={item.id} className="text-sm">
                <Link href={`/marriage/homework/${item.id}`} className="font-semibold text-clay-900 dark:text-sand-100">
                  {item.title}
                </Link>
                <p className="text-xs capitalize text-night-500">{item.status.replace(/_/g, " ")}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hub.premaritalProgram ? (
        <>
          <MarriageCoupleSessionProgressTracker program={hub.premaritalProgram} />
          <MarriageCoupleProgramCompletionBanner hub={hub} />
          <MarriageCouplePremaritalProgramSection program={hub.premaritalProgram} />
        </>
      ) : null}

      {hub.certificatesGallery && hub.journey ? (
        <MarriageCoupleCertificatesSection gallery={hub.certificatesGallery} journeyId={hub.journey.id} />
      ) : null}

      <MarriageCoupleHelpSection />
    </>
  );
}
