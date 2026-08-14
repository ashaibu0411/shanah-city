import { WEEKDAY_OPTIONS } from "@/lib/calendar-utils";

type EventCalendarFieldsProps = {
  startsOn: string;
  endsOn: string;
  recurringWeekday: string;
  onStartsOnChange: (value: string) => void;
  onEndsOnChange: (value: string) => void;
  onRecurringWeekdayChange: (value: string) => void;
};

export function EventCalendarFields({
  startsOn,
  endsOn,
  recurringWeekday,
  onStartsOnChange,
  onEndsOnChange,
  onRecurringWeekdayChange,
}: EventCalendarFieldsProps) {
  return (
    <>
      <input
        type="date"
        value={startsOn}
        onChange={(event) => onStartsOnChange(event.target.value)}
        aria-label="Start date"
        className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
      />
      <input
        type="date"
        value={endsOn}
        onChange={(event) => onEndsOnChange(event.target.value)}
        aria-label="End date"
        className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
      />
      <select
        value={recurringWeekday}
        onChange={(event) => onRecurringWeekdayChange(event.target.value)}
        className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
      >
        <option value="">Repeat weekly on calendar (optional)</option>
        {WEEKDAY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Every {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
