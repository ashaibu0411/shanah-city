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
        aria-label="End date (optional)"
        className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
      />
      <select
        value={recurringWeekday}
        onChange={(event) => onRecurringWeekdayChange(event.target.value)}
        className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
      >
        <option value="">Does not repeat</option>
        <option value="monthly">Repeat monthly — same day of the month</option>
        {WEEKDAY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Every {option.label}
          </option>
        ))}
      </select>
      {recurringWeekday === "monthly" ? (
        <p className="text-xs text-night-600 sm:col-span-2" role="status">
          Repeats every month on day {/^\\d{4}-\\d{2}-\\d{2}$/.test(startsOn) ? Number(startsOn.slice(8, 10)) : "selected in Start date"}. Choose a Start date above. Months without that day are skipped; End date is optional.
        </p>
      ) : null}
    </>
  );
}
