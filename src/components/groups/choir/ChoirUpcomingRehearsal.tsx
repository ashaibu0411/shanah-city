import Link from "next/link";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

type ChoirUpcomingRehearsalProps = {
  rehearsal: ChoirRehearsalView | null;
  calendarHref: string;
  canManageSchedule: boolean;
  onManageSchedule?: () => void;
};

export function ChoirUpcomingRehearsal({
  rehearsal,
  calendarHref,
  canManageSchedule,
  onManageSchedule,
}: ChoirUpcomingRehearsalProps) {
  return (
    <section aria-labelledby="choir-rehearsal-heading" className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="choir-rehearsal-heading" className="choir-section-heading">
          Upcoming rehearsal
        </h2>
        <Link href={calendarHref} className="min-h-[44px] inline-flex items-center text-xs font-bold text-[var(--choir-gold-dark)]">
          See all
        </Link>
      </div>

      {rehearsal ? (
        <Link href={calendarHref} className="choir-card block overflow-hidden transition active:scale-[0.99]">
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
      ) : null}
      {canManageSchedule && onManageSchedule ? (
        <button
          type="button"
          onClick={onManageSchedule}
          className="mt-3 text-xs font-semibold text-[var(--choir-gold-dark)] underline"
        >
          Schedule a different rehearsal day →
        </button>
      ) : null}
    </section>
  );
}
