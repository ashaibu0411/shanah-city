import Link from "next/link";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

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
    <section aria-labelledby="choir-rehearsal-heading" className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="choir-rehearsal-heading" className="choir-section-heading">
          Upcoming rehearsal
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[44px] text-xs font-bold text-[var(--choir-gold-dark)]"
        >
          See all
        </button>
      </div>

      {!rehearsal ? (
        <div className="choir-card p-4">
          <p className="font-bold text-[var(--choir-heading)]">No upcoming rehearsal</p>
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
        <Link href={rehearsal.calendarHref} className="choir-card block overflow-hidden transition active:scale-[0.99]">
          <div className="choir-rehearsal-thumb-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CHOIR_HERO_IMAGE_PATH} alt="" className="choir-rehearsal-thumb" />
          </div>
          <div className="p-3.5">
            <h3 className="text-base font-bold text-[var(--choir-heading)]">{rehearsal.title}</h3>
            <p className="mt-1 text-sm font-medium text-[var(--choir-body)]">{rehearsal.dateLabel}</p>
            <p className="text-sm text-[var(--choir-body)]">{rehearsal.timeLabel}</p>
            <p className="text-sm text-[var(--choir-muted)]">{rehearsal.location}</p>
          </div>
        </Link>
      )}
    </section>
  );
}
