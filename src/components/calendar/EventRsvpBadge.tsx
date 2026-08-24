export function EventRsvpBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-teal-100 font-bold uppercase tracking-wide text-teal-900 ring-1 ring-teal-200 ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      RSVP needed
    </span>
  );
}
