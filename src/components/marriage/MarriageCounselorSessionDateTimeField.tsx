"use client";

import { MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE } from "@/lib/marriage-session-scheduling";

type Props = {
  name?: string;
  inputClassName?: string;
  required?: boolean;
};

export function MarriageCounselorSessionDateTimeField({
  name = "scheduledAtLocal",
  inputClassName = "marriage-c3m-input",
  required,
}: Props) {
  const tzLabel = MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE.replace("_", " ");

  return (
    <div className="marriage-session-schedule-datetime">
      <label className="text-sm font-semibold text-[#292219] dark:text-sand-100" htmlFor={`${name}-input`}>
        Date & time
      </label>
      <input
        id={`${name}-input`}
        name={name}
        type="datetime-local"
        required={required}
        className={inputClassName}
      />
      <input type="hidden" name="schedulingTimeZone" value={MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE} />
      <p className="marriage-c3m-muted text-xs">
        Enter time in {tzLabel} (church scheduling timezone).
      </p>
    </div>
  );
}
