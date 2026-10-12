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

  return (
    <section className="choir-card choir-assignment-card" aria-labelledby="choir-next-assignment">
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
        <div className="choir-assignment-layout">
          <div className="choir-assignment-date-block" aria-hidden>
            <span className="choir-assignment-date-weekday">{assignmentDateBlock(card.serviceDate).weekday}</span>
            <span className="choir-assignment-date-day">{assignmentDateBlock(card.serviceDate).day}</span>
            <span className="choir-assignment-date-month">{assignmentDateBlock(card.serviceDate).month}</span>
          </div>

          <div className="choir-assignment-main min-w-0 flex-1">
            <p id="choir-next-assignment" className="choir-assignment-kicker">
              Next worship assignment
            </p>
            <h2 className="choir-assignment-title">{card.title}</h2>

            <ul className="choir-assignment-meta mt-3 space-y-2">
              <li className="choir-meta-row">
                <span className="choir-meta-icon">
                  <ChoirIconCalendarSmall />
                </span>
                <span className="choir-assignment-meta-strong">{card.dateTimeLabel}</span>
              </li>
              <li className="choir-meta-row">
                <span className="choir-meta-icon">
                  <ChoirIconPin />
                </span>
                <span>{card.location}</span>
              </li>
              {card.songCount > 0 ? (
                <li className="choir-meta-row">
                  <span className="choir-meta-icon">
                    <ChoirIconStar />
                  </span>
                  <span>
                    {card.songCount} song{card.songCount === 1 ? "" : "s"} assigned
                  </span>
                </li>
              ) : null}
            </ul>

            {!assignment && upcomingPreview ? (
              <p className="choir-assignment-roster-note">
                You are not on this service roster. This is the next published service for the team.
              </p>
            ) : null}

            <div className="choir-assignment-footer">
              <div className="choir-assignment-roles">
                {assignment?.roleLabel ? (
                  <div className="choir-assignment-role-cell">
                    <p className="choir-role-cell-label">
                      <ChoirIconMic />
                      Your role
                    </p>
                    <p className="choir-role-cell-value">{assignment.roleLabel}</p>
                  </div>
                ) : null}
                <div className="choir-assignment-role-cell">
                  <p className="choir-role-cell-label">
                    <ChoirIconUsers />
                    Team
                  </p>
                  <p className="choir-role-cell-value">Worship choir</p>
                </div>
              </div>
              <div className="choir-assignment-actions">
                {assignment ? (
                  <Link href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/team`} className="choir-assignment-link">
                    My assignments
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
