import Link from "next/link";
import type { ChoirAssignmentView } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  ChoirIconCalendarSmall,
  ChoirIconMic,
  ChoirIconPin,
  ChoirIconStar,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";

type ChoirNextAssignmentCardProps = {
  assignment: ChoirAssignmentView | null;
  upcomingPreview: ChoirAssignmentView | null;
};

function assignmentDateBlock(serviceDate: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    day: date.getDate(),
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
}

export function ChoirNextAssignmentCard({
  assignment,
  upcomingPreview,
}: ChoirNextAssignmentCardProps) {
  const card = assignment ?? upcomingPreview;
  const dateParts = card ? assignmentDateBlock(card.serviceDate) : null;

  return (
    <section
      className="choir-card choir-assignment-card rounded-2xl border border-[var(--choir-border,#eae2d7)] bg-white p-4 shadow-[0_8px_24px_rgba(37,32,42,0.06)]"
      aria-labelledby="choir-next-assignment"
      data-ui="choir-next-assignment-v2"
    >
      {!card || !dateParts ? (
        <>
          <p className="choir-assignment-kicker text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa751d]">
            Next worship assignment
          </p>
          <h2 id="choir-next-assignment" className="choir-assignment-title mt-2 font-display text-2xl font-bold text-[#25202a]">
            No upcoming assignment
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--choir-muted,#817a7b)]">
            Your next worship assignment will appear here when it is published.
          </p>
        </>
      ) : (
        <div className="choir-assignment-layout flex items-stretch gap-3">
          <div
            className="choir-assignment-date-block flex w-[62px] min-h-[86px] shrink-0 flex-col items-center justify-center rounded-[14px] border border-[#d6a64c]/20 bg-[#f2ece1] px-1.5 py-2.5 text-center"
            aria-hidden
          >
            <span className="text-[10px] font-bold tracking-[0.08em] text-[#817a7b]">{dateParts.weekday}</span>
            <span className="text-[1.75rem] font-extrabold leading-none text-[#25202a]">{dateParts.day}</span>
            <span className="text-[11px] font-bold text-[#aa751d]">{dateParts.month}</span>
          </div>

          <div className="choir-assignment-main min-w-0 flex-1">
            <p
              id="choir-next-assignment"
              className="choir-assignment-kicker text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa751d]"
            >
              Next worship assignment
            </p>
            <h2 className="choir-assignment-title mt-1 font-display text-[clamp(1.35rem,5vw,1.55rem)] font-bold leading-tight text-[#25202a]">
              {card.title}
            </h2>

            <ul className="choir-assignment-meta mt-3 list-none space-y-2 p-0">
              <li className="flex items-start gap-2 text-[13px] leading-snug text-[#49434a]">
                <span className="mt-0.5 shrink-0 text-[#aa751d]">
                  <ChoirIconCalendarSmall />
                </span>
                <span className="font-semibold text-[#25202a]">{card.dateTimeLabel}</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] leading-snug text-[#49434a]">
                <span className="mt-0.5 shrink-0 text-[#aa751d]">
                  <ChoirIconPin />
                </span>
                <span>{card.location}</span>
              </li>
              {card.songCount > 0 ? (
                <li className="flex items-start gap-2 text-[13px] leading-snug text-[#49434a]">
                  <span className="mt-0.5 shrink-0 text-[#aa751d]">
                    <ChoirIconStar />
                  </span>
                  <span>
                    {card.songCount} song{card.songCount === 1 ? "" : "s"} assigned
                  </span>
                </li>
              ) : null}
            </ul>

            {!assignment && upcomingPreview ? (
              <p className="mt-3 text-xs leading-relaxed text-[#817a7b]">
                You are not on this service roster. This is the next published service for the team.
              </p>
            ) : null}

            <div className="choir-assignment-footer mt-3.5 flex items-end justify-between gap-3 border-t border-[#eae2d7] pt-3">
              <div className="choir-assignment-roles flex min-w-0 flex-wrap gap-x-4 gap-y-2">
                {assignment?.roleLabel ? (
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#817a7b]">
                      <ChoirIconMic />
                      Your role
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#25202a]">{assignment.roleLabel}</p>
                  </div>
                ) : null}
                <div>
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#817a7b]">
                    <ChoirIconUsers />
                    Team
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#25202a]">Worship choir</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {assignment ? (
                  <Link
                    href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/team`}
                    className="text-xs font-bold text-[#aa751d] underline underline-offset-2"
                  >
                    My assignments
                  </Link>
                ) : null}
                <Link
                  href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(card.serviceDate)}&time=${encodeURIComponent(card.serviceTime)}`}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d6a64c] via-[#c9923f] to-[#aa751d] px-3.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(166,118,42,0.22)]"
                >
                  View setlist
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
