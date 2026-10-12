import Link from "next/link";
import type { ChoirAssignmentView } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  ChoirIconCalendarSmall,
  ChoirIconMic,
  ChoirIconPin,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";

/** Bumped when assignment card layout changes (helps break stale WebView JS caches). */
export const CHOIR_NEXT_ASSIGNMENT_CARD_REVISION = 4;

type ChoirNextWorshipAssignmentCardProps = {
  assignment: ChoirAssignmentView | null;
  upcomingPreview: ChoirAssignmentView | null;
};

export function ChoirNextWorshipAssignmentCard({
  assignment,
  upcomingPreview,
}: ChoirNextWorshipAssignmentCardProps) {
  const card = assignment ?? upcomingPreview;
  const planHref = card
    ? `/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(card.serviceDate)}&time=${encodeURIComponent(card.serviceTime)}`
    : "#";

  return (
    <section
      className="choir-card rounded-2xl border border-[var(--choir-border,#eae2d7)] bg-white p-4 shadow-[0_8px_24px_rgba(37,32,42,0.06)]"
      aria-labelledby="choir-next-service-heading"
      data-choir-assignment-card={CHOIR_NEXT_ASSIGNMENT_CARD_REVISION}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f5e5c4] text-[#aa751d]">
          <ChoirIconCalendarSmall />
        </span>
        <p id="choir-next-service-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#aa751d]">
          Next service
        </p>
      </div>

      {!card ? (
        <>
          <h2 className="mt-3 font-display text-xl font-bold text-[#25202a]">No upcoming assignment</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#817a7b]">
            Your next worship assignment will appear here when it is published.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-display text-[1.35rem] font-bold leading-tight text-[#25202a] sm:text-xl">
            {card.title}
          </h2>

          <div className="mt-3 space-y-2">
            <p className="flex items-start gap-2 text-[13px] leading-snug text-[#49434a]">
              <span className="mt-0.5 shrink-0 text-[#aa751d]">
                <ChoirIconCalendarSmall />
              </span>
              <span>{card.dateTimeLabel}</span>
            </p>
            <p className="flex items-start gap-2 text-[13px] leading-snug text-[#49434a]">
              <span className="mt-0.5 shrink-0 text-[#aa751d]">
                <ChoirIconPin />
              </span>
              <span>{card.location}</span>
            </p>
          </div>

          {!assignment && upcomingPreview ? (
            <p className="mt-3 text-xs leading-relaxed text-[#817a7b]">
              You are not on this service roster. This is the next published service for the team.
            </p>
          ) : null}

          {assignment?.roleLabel || card.songCount > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {assignment?.roleLabel ? (
                <div className="flex items-start gap-2 rounded-xl bg-[#f5efe5] px-3 py-2.5">
                  <span className="mt-0.5 shrink-0 text-[#aa751d]">
                    <ChoirIconMic />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#817a7b]">Your role</p>
                    <p className="mt-0.5 text-sm font-bold leading-snug text-[#25202a]">{assignment.roleLabel}</p>
                  </div>
                </div>
              ) : (
                <div aria-hidden />
              )}
              {card.songCount > 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-[#f5efe5] px-3 py-2.5">
                  <span className="shrink-0 text-[#aa751d]">
                    <ChoirIconUsers />
                  </span>
                  <p className="text-sm font-bold leading-snug text-[#25202a]">
                    {card.songCount} song{card.songCount === 1 ? "" : "s"} assigned
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={planHref}
            className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#d6a64c] text-[0.9rem] font-bold tracking-wide text-[#25202a] transition active:scale-[0.98]"
          >
            View worship plan
            <span aria-hidden>→</span>
          </Link>
        </>
      )}
    </section>
  );
}
