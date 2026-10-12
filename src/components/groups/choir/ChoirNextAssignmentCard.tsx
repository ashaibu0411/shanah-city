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

function timeFromLabel(dateTimeLabel: string) {
  const parts = dateTimeLabel.split("•");
  return parts.length > 1 ? parts[parts.length - 1].trim() : dateTimeLabel;
}

export function ChoirNextAssignmentCard({
  assignment,
  upcomingPreview,
}: ChoirNextAssignmentCardProps) {
  const card = assignment ?? upcomingPreview;

  return (
    <section className="choir-card choir-assignment-card p-4" aria-labelledby="choir-next-assignment">
      {!card ? (
        <>
          <p className="choir-assignment-kicker">Next worship assignment</p>
          <h2 id="choir-next-assignment" className="choir-assignment-title mt-2">
            No upcoming assignment
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--choir-muted)]">
            Your next worship assignment will appear here when it is published.
          </p>
        </>
      ) : (
        <div className="flex gap-3">
          <div className="choir-assignment-date-block" aria-hidden>
            <span className="choir-assignment-date-weekday">{assignmentDateBlock(card.serviceDate).weekday}</span>
            <span className="choir-assignment-date-day">{assignmentDateBlock(card.serviceDate).day}</span>
            <span className="choir-assignment-date-month">{assignmentDateBlock(card.serviceDate).month}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p id="choir-next-assignment" className="choir-assignment-kicker">Next worship assignment</p>
            <h2 className="choir-assignment-title mt-1">{card.title}</h2>

            <div className="mt-3 space-y-2">
              <p className="choir-meta-row text-[15px]">
                <span className="choir-meta-icon">
                  <ChoirIconCalendarSmall />
                </span>
                <span className="font-semibold text-[var(--choir-heading)]">{timeFromLabel(card.dateTimeLabel)}</span>
              </p>
              <p className="choir-meta-row text-[15px]">
                <span className="choir-meta-icon">
                  <ChoirIconPin />
                </span>
                <span className="font-medium">{card.location}</span>
              </p>
              {card.songCount > 0 ? (
                <p className="choir-meta-row text-[15px]">
                  <span className="choir-meta-icon">
                    <ChoirIconStar />
                  </span>
                  <span className="font-medium">
                    {card.songCount} song{card.songCount === 1 ? "" : "s"} assigned
                  </span>
                </p>
              ) : null}
            </div>

            {!assignment && upcomingPreview ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--choir-muted)]">
                You are not on this service roster. This is the next published service for the team.
              </p>
            ) : null}

            <div className="choir-assignment-footer mt-4">
              <div className="choir-assignment-roles">
                {assignment?.roleLabel ? (
                  <div>
                    <p className="choir-role-cell-label flex items-center gap-1">
                      <ChoirIconMic />
                      Your role
                    </p>
                    <p className="choir-role-cell-value text-[15px]">{assignment.roleLabel}</p>
                  </div>
                ) : null}
                <div>
                  <p className="choir-role-cell-label flex items-center gap-1">
                    <ChoirIconUsers />
                    Team
                  </p>
                  <p className="choir-role-cell-value text-[15px]">Worship choir</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {assignment ? (
                  <Link
                    href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/team`}
                    className="choir-assignment-cta"
                  >
                    My assignments
                    <span aria-hidden>→</span>
                  </Link>
                ) : null}
                <Link
                  href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(card.serviceDate)}&time=${encodeURIComponent(card.serviceTime)}`}
                  className="choir-assignment-cta"
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
