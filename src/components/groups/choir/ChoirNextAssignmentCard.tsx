import Link from "next/link";
import type { ChoirAssignmentView } from "@/lib/choir-dashboard-types";
import {
  ChoirIconCalendarSmall,
  ChoirIconMic,
  ChoirIconPin,
  ChoirIconStar,
} from "@/components/groups/choir/choir-icons";

type ChoirNextAssignmentCardProps = {
  assignment: ChoirAssignmentView | null;
  upcomingPreview: ChoirAssignmentView | null;
};

export function ChoirNextAssignmentCard({
  assignment,
  upcomingPreview,
}: ChoirNextAssignmentCardProps) {
  const card = assignment ?? upcomingPreview;

  return (
    <section className="choir-card p-4" aria-labelledby="choir-next-assignment">
      <div className="flex items-center gap-2">
        <span className="choir-tile-icon !h-8 !w-8">
          <ChoirIconCalendarSmall />
        </span>
        <p id="choir-next-assignment" className="choir-section-label !text-[var(--choir-gold-dark)]">
          Next service
        </p>
      </div>

      {!card ? (
        <>
          <h2 className="mt-3 font-display text-xl font-bold text-[var(--choir-heading)]">
            No upcoming assignment
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--choir-muted)]">
            Your next worship assignment will appear here when it is published.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-display text-xl font-bold text-[var(--choir-heading)]">{card.title}</h2>

          <div className="mt-3 space-y-2">
            <p className="choir-meta-row">
              <span className="choir-meta-icon">
                <ChoirIconCalendarSmall />
              </span>
              <span>{card.dateTimeLabel}</span>
            </p>
            <p className="choir-meta-row">
              <span className="choir-meta-icon">
                <ChoirIconPin />
              </span>
              <span>{card.location}</span>
            </p>
          </div>

          {!assignment && upcomingPreview ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--choir-muted)]">
              You are not on this service roster. This is the next published service for the team.
            </p>
          ) : null}

          {assignment?.roleLabel || card.songCount > 0 ? (
            <div className="choir-role-grid">
              {assignment?.roleLabel ? (
                <div>
                  <p className="choir-role-cell-label flex items-center gap-1">
                    <ChoirIconMic />
                    Your role
                  </p>
                  <p className="choir-role-cell-value">{assignment.roleLabel}</p>
                </div>
              ) : (
                <div />
              )}
              {card.songCount > 0 ? (
                <div>
                  <p className="choir-role-cell-label flex items-center gap-1">
                    <ChoirIconStar />
                    Setlist
                  </p>
                  <p className="choir-role-cell-value">
                    {card.songCount} song{card.songCount === 1 ? "" : "s"} assigned
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <Link href={card.worshipHref} className="choir-btn-primary mt-4">
            View worship plan
            <span aria-hidden>→</span>
          </Link>
        </>
      )}
    </section>
  );
}
