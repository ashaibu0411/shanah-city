type Props = {
  assignedAfterLabel?: string;
  preparingForLabel?: string | null;
  postProgramNote?: string;
  estimatedMinutes?: number;
  dueAt?: string;
  dueAtTimeZone?: string;
  formatDue?: (dueAt: string, tz?: string) => string;
  className?: string;
};

export function MarriageHomeworkTimingLines({
  assignedAfterLabel,
  preparingForLabel,
  postProgramNote,
  estimatedMinutes,
  dueAt,
  dueAtTimeZone,
  formatDue,
  className = "",
}: Props) {
  return (
    <ul className={`space-y-0.5 text-xs text-night-600 dark:text-sand-400 ${className}`}>
      {assignedAfterLabel ? <li>{assignedAfterLabel}</li> : null}
      {preparingForLabel ? <li>{preparingForLabel}</li> : null}
      {postProgramNote ? <li className="italic">{postProgramNote}</li> : null}
      {estimatedMinutes ? <li>Estimated completion: ~{estimatedMinutes} minutes</li> : null}
      {dueAt && formatDue ? <li>Due: {formatDue(dueAt, dueAtTimeZone)}</li> : null}
    </ul>
  );
}
