import Link from "next/link";
import type { ChoirAssignmentView } from "@/lib/choir-dashboard-types";
import { ChoirIconStar } from "@/components/groups/choir/choir-icons";

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
      <div className="flex items-start gap-3">
        <div className="choir-tile-icon shrink-0">
          <ChoirIconStar />
        </div>
        <div className="min-w-0 flex-1">
          <p id="choir-next-assignment" className="choir-section-label">
            {assignment ? "Next worship assignment" : "Next worship service"}
          </p>

          {!card ? (
            <>
              <h2 className="mt-2 text-lg font-bold text-[var(--choir-heading)]">
                No upcoming assignment
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--choir-muted)]">
                Your next worship assignment will appear here when it is published.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-bold text-[var(--choir-heading)]">{card.title}</h2>
              <p className="mt-1 text-sm text-[var(--choir-body)]">{card.dateTimeLabel}</p>
              <p className="text-sm text-[var(--choir-muted)]">{card.location}</p>

              {assignment?.roleLabel ? (
                <p className="mt-3 text-sm font-semibold text-[var(--choir-heading)]">
                  Your role: <span className="text-[var(--choir-gold-dark)]">{assignment.roleLabel}</span>
                </p>
              ) : !assignment && upcomingPreview ? (
                <p className="mt-3 text-xs leading-relaxed text-[var(--choir-muted)]">
                  You are not on this service roster. This is the next published service for the team.
                </p>
              ) : null}

              {card.songCount > 0 ? (
                <p className="mt-2 text-sm font-medium text-[var(--choir-body)]">
                  {card.songCount} song{card.songCount === 1 ? "" : "s"} in setlist
                </p>
              ) : null}

              <Link href={card.worshipHref} className="choir-btn-primary mt-4">
                View worship plan
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
