import Link from "next/link";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";

type ChoirUpcomingRehearsalProps = {
  rehearsal: ChoirRehearsalView | null;
  onSeeAll: () => void;
  canManageSchedule: boolean;
  onManageSchedule?: () => void;
};

export function ChoirUpcomingRehearsal({
  rehearsal,
  onSeeAll,
  canManageSchedule,
  onManageSchedule,
}: ChoirUpcomingRehearsalProps) {
  return (
    <section aria-labelledby="choir-rehearsal-heading">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="choir-rehearsal-heading" className="text-base font-semibold text-[var(--choir-heading)]">
          Upcoming rehearsal
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[44px] text-xs font-semibold text-[var(--choir-gold-dark)]"
        >
          See all
        </button>
      </div>

      {!rehearsal ? (
        <div className="choir-card p-4">
          <p className="font-semibold text-[var(--choir-heading)]">No upcoming rehearsal</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--choir-muted)]">
            New rehearsal details will appear here when your leader publishes them.
          </p>
          {canManageSchedule && onManageSchedule ? (
            <button
              type="button"
              onClick={onManageSchedule}
              className="mt-4 text-sm font-semibold text-[var(--choir-gold-dark)] underline"
            >
              Schedule on Events tab
            </button>
          ) : null}
        </div>
      ) : (
        <Link href={rehearsal.calendarHref} className="choir-card block p-4 transition active:scale-[0.99]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--choir-muted)]">
            {rehearsal.source === "worship-plan" ? "From worship plan" : "Choir calendar"}
          </p>
          <h3 className="mt-1 text-base font-bold text-[var(--choir-heading)]">{rehearsal.title}</h3>
          <p className="mt-1 text-sm text-[var(--choir-body)]">{rehearsal.dateLabel}</p>
          <p className="text-sm text-[var(--choir-body)]">{rehearsal.timeLabel}</p>
          <p className="text-sm text-[var(--choir-muted)]">{rehearsal.location}</p>
          {rehearsal.notes ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--choir-body)]">{rehearsal.notes}</p>
          ) : null}
        </Link>
      )}
    </section>
  );
}
